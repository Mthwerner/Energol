/**
 * POST /api/admin/sync-rounds
 *
 * Sincroniza rodadas e jogos de um bolão a partir da football-data.org.
 * Cria rodadas que ainda não existem e atualiza jogos existentes (times,
 * emblemas, data, status e placar quando FINISHED).
 *
 * Body: { poolId: string; competition: "WC2026" | "BSA2026" }
 * Requer: dono do bolão ou ADMIN.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  fetchWC2026Matches,
  fetchBR2026Matches,
  getRoundDef,
  toGameStatus,
  minDate,
  maxDate,
  WC2026_ROUNDS,
  BSA2026_ROUNDS,
  type FDMatch,
  type RoundDef,
} from '@/lib/football-data';
import { setGameResult, recalculateRoundResults } from '@/services/result.service';
import { GameStatus, RoundStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { poolId, competition } = body ?? {};

  if (!poolId || !competition) {
    return NextResponse.json({ error: 'poolId e competition são obrigatórios' }, { status: 400 });
  }
  if (competition !== 'WC2026' && competition !== 'BSA2026') {
    return NextResponse.json({ error: 'competition inválida' }, { status: 400 });
  }

  // Verificar se é dono do bolão ou admin
  const [pool, user] = await Promise.all([
    prisma.pool.findUnique({ where: { id: poolId } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  if (!pool) {
    return NextResponse.json({ error: 'Bolão não encontrado' }, { status: 404 });
  }

  const isAdmin = user?.role === 'ADMIN';
  const isOwner = pool.ownerId === session.user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Acesso restrito ao dono do bolão' }, { status: 403 });
  }

  try {
    const allMatches: FDMatch[] =
      competition === 'WC2026' ? await fetchWC2026Matches() : await fetchBR2026Matches();

    const roundDefs: RoundDef[] = competition === 'WC2026' ? WC2026_ROUNDS : BSA2026_ROUNDS;

    // Agrupar partidas por rodada; rastrear estágios não reconhecidos para diagnóstico
    const byRound = new Map<number, FDMatch[]>();
    const unknownStageCount = new Map<string, number>();
    for (const match of allMatches) {
      const def = getRoundDef(match, roundDefs);
      if (!def) {
        unknownStageCount.set(match.stage, (unknownStageCount.get(match.stage) ?? 0) + 1);
        continue;
      }
      if (!byRound.has(def.number)) byRound.set(def.number, []);
      byRound.get(def.number)!.push(match);
    }

    let roundsCreated = 0;
    let roundsUpdated = 0;
    let gamesCreated = 0;
    let gamesUpdated = 0;
    let newResults = 0;
    const roundDetails: { name: string; gamesFromApi: number; gamesCreated: number; gamesUpdated: number }[] = [];

    for (const def of roundDefs) {
      const matches = byRound.get(def.number) ?? [];
      if (matches.length === 0) continue;

      let roundGamesCreated = 0;
      let roundGamesUpdated = 0;

      const start = minDate(matches);
      const end = maxDate(matches);

      const allFinished = matches.every(
        (m) => m.status === 'FINISHED' || m.status === 'AWARDED',
      );
      const anyStarted = matches.some(
        (m) => m.status === 'IN_PLAY' || m.status === 'PAUSED' || m.status === 'FINISHED' || m.status === 'AWARDED',
      );
      const roundStatus: RoundStatus = allFinished
        ? RoundStatus.FINISHED
        : anyStarted
          ? RoundStatus.IN_PROGRESS
          : RoundStatus.OPEN;

      const existing = await prisma.round.findUnique({
        where: { poolId_number: { poolId, number: def.number } },
      });

      // stage é salvo para que getKnockoutWeight possa identificar a fase
      // e para o lock de edição de pesos funcionar corretamente.
      const round = await prisma.round.upsert({
        where: { poolId_number: { poolId, number: def.number } },
        update: { name: def.name, startDate: start, endDate: end, status: roundStatus, stage: def.stage },
        create: {
          poolId,
          number: def.number,
          name: def.name,
          startDate: start,
          endDate: end,
          status: roundStatus,
          stage: def.stage,
        },
      });

      if (existing) roundsUpdated++; else roundsCreated++;

      for (const m of matches) {
        // Usa || em vez de ?? para tratar strings vazias como nulas (API pode retornar "")
        const homeTeamApi = m.homeTeam?.shortName || m.homeTeam?.name || null;
        const awayTeamApi = m.awayTeam?.shortName || m.awayTeam?.name || null;
        const homeCrest = m.homeTeam?.crest || null;
        const awayCrest = m.awayTeam?.crest || null;
        const matchDate = new Date(m.utcDate);
        const status = toGameStatus(m.status) as GameStatus;
        const group = m.group ?? null;

        // Busca o jogo filtrando pelo pool — externalId não é mais único globalmente,
        // cada bolão tem suas próprias cópias dos jogos.
        // Fallback para matchDate quando o jogo foi criado manualmente (sem externalId).
        let existingGame = await prisma.game.findFirst({
          where: { externalId: m.id, round: { poolId } },
        });
        if (!existingGame) {
          existingGame = await prisma.game.findFirst({
            where: { roundId: round.id, externalId: null, matchDate },
          }) ?? null;
          // Vincula o externalId ao jogo manual encontrado
          if (existingGame) {
            await prisma.game.update({ where: { id: existingGame.id }, data: { externalId: m.id } });
          }
        }

        // Novo resultado → calcular pontuações
        if (
          status === 'FINISHED' &&
          existingGame &&
          existingGame.status !== 'FINISHED' &&
          m.score.fullTime.home !== null &&
          m.score.fullTime.away !== null
        ) {
          await setGameResult(
            existingGame.id,
            m.score.fullTime.home,
            m.score.fullTime.away,
            session.user.id,
          );
          newResults++;
        }

        // Só sobrescreve time/escudo quando a API retornar um nome real.
        // Evita apagar times/escudos já confirmados se a API devolver null em sync futura.
        // Para jogos já FINISHED com palpites, não atualiza homeTeam/awayTeam nem scores:
        // a API pode ter home/away na ordem oposta à que foi usada quando os palpites foram feitos,
        // o que causaria inversão visual dos palpites sem mudar os pontos calculados.
        const alreadyFinished = existingGame?.status === 'FINISHED' && (existingGame?.homeScore ?? null) !== null;
        const teamUpdate: { homeTeam?: string; homeCrest?: string | null; awayTeam?: string; awayCrest?: string | null } = {};
        if (!alreadyFinished) {
          if (homeTeamApi) { teamUpdate.homeTeam = homeTeamApi; teamUpdate.homeCrest = homeCrest; }
          if (awayTeamApi) { teamUpdate.awayTeam = awayTeamApi; teamUpdate.awayCrest = awayCrest; }
        }

        if (existingGame) {
          await prisma.game.update({
            where: { id: existingGame.id },
            data: {
              ...teamUpdate,
              matchDate, status, group,
              // Não sobrescreve placar de jogo já finalizado — evita inversão de home/away
              homeScore: alreadyFinished ? existingGame.homeScore : (status === 'FINISHED' ? m.score.fullTime.home : null),
              awayScore: alreadyFinished ? existingGame.awayScore : (status === 'FINISHED' ? m.score.fullTime.away : null),
            },
          });
          gamesUpdated++;
          roundGamesUpdated++;
        } else {
          await prisma.game.create({
            data: {
              roundId: round.id,
              externalId: m.id,
              homeTeam: homeTeamApi ?? 'A definir',
              awayTeam: awayTeamApi ?? 'A definir',
              homeCrest, awayCrest, matchDate, status, group,
              homeScore: status === 'FINISHED' ? m.score.fullTime.home : null,
              awayScore: status === 'FINISHED' ? m.score.fullTime.away : null,
            },
          });
          gamesCreated++;
          roundGamesCreated++;
        }
      }

      roundDetails.push({ name: def.name, gamesFromApi: matches.length, gamesCreated: roundGamesCreated, gamesUpdated: roundGamesUpdated });

      // Garante que pontos e scores estejam corretos em rodadas finalizadas.
      // Necessário porque: (a) jogos novos chegam já como FINISHED sem passar pelo
      // setGameResult, e (b) o upsert da rodada define status=FINISHED antes de
      // processar jogos, bloqueando o recalculateRoundScores interno do setGameResult.
      if (allFinished) {
        await recalculateRoundResults(round.id);
      }
    }

    // Invalida o cache da tabela de classificação e artilharia
    revalidateTag(competition === 'WC2026' ? 'standings-WC' : 'standings-BSA');
    revalidateTag(competition === 'WC2026' ? 'scorers-WC' : 'scorers-BSA');

    const unknownStages = Object.fromEntries(unknownStageCount);

    return NextResponse.json({
      ok: true,
      summary: {
        roundsCreated,
        roundsUpdated,
        gamesCreated,
        gamesUpdated,
        newResults,
        roundDetails,
        unknownStages,
      },
    });
  } catch (err) {
    console.error('[sync-rounds]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
