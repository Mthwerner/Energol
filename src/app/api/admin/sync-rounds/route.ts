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
import { setGameResult } from '@/services/result.service';
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

    // Agrupar partidas por rodada
    const byRound = new Map<number, FDMatch[]>();
    for (const match of allMatches) {
      const def = getRoundDef(match, roundDefs);
      if (!def) continue;
      if (!byRound.has(def.number)) byRound.set(def.number, []);
      byRound.get(def.number)!.push(match);
    }

    let roundsCreated = 0;
    let roundsUpdated = 0;
    let gamesCreated = 0;
    let gamesUpdated = 0;
    let newResults = 0;

    for (const def of roundDefs) {
      const matches = byRound.get(def.number) ?? [];
      if (matches.length === 0) continue;

      const start = minDate(matches);
      const end = maxDate(matches);

      const allFinished = matches.every(
        (m) => m.status === 'FINISHED' || m.status === 'AWARDED',
      );
      const roundStatus: RoundStatus = allFinished ? RoundStatus.FINISHED : RoundStatus.OPEN;

      const existing = await prisma.round.findUnique({
        where: { poolId_number: { poolId, number: def.number } },
      });

      const round = await prisma.round.upsert({
        where: { poolId_number: { poolId, number: def.number } },
        update: { name: def.name, startDate: start, endDate: end, status: roundStatus },
        create: {
          poolId,
          number: def.number,
          name: def.name,
          startDate: start,
          endDate: end,
          status: roundStatus,
        },
      });

      if (existing) roundsUpdated++; else roundsCreated++;

      for (const m of matches) {
        const homeTeam = m.homeTeam?.shortName ?? m.homeTeam?.name ?? 'A definir';
        const awayTeam = m.awayTeam?.shortName ?? m.awayTeam?.name ?? 'A definir';
        const homeCrest = m.homeTeam?.crest ?? null;
        const awayCrest = m.awayTeam?.crest ?? null;
        const matchDate = new Date(m.utcDate);
        const status = toGameStatus(m.status) as GameStatus;
        const group = m.group ?? null;

        const existingGame = await prisma.game.findUnique({ where: { externalId: m.id } });

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

        await prisma.game.upsert({
          where: { externalId: m.id },
          update: {
            homeTeam, awayTeam, homeCrest, awayCrest, matchDate, status, group,
            homeScore: status === 'FINISHED' ? m.score.fullTime.home : null,
            awayScore: status === 'FINISHED' ? m.score.fullTime.away : null,
          },
          create: {
            roundId: round.id,
            externalId: m.id,
            homeTeam, awayTeam, homeCrest, awayCrest, matchDate, status, group,
            homeScore: status === 'FINISHED' ? m.score.fullTime.home : null,
            awayScore: status === 'FINISHED' ? m.score.fullTime.away : null,
          },
        });

        if (existingGame) gamesUpdated++; else gamesCreated++;
      }
    }

    // Invalida o cache da tabela de classificação desta competição
    revalidateTag(competition === 'WC2026' ? 'standings-WC' : 'standings-BSA');

    return NextResponse.json({
      ok: true,
      summary: {
        roundsCreated,
        roundsUpdated,
        gamesCreated,
        gamesUpdated,
        newResults,
      },
    });
  } catch (err) {
    console.error('[sync-rounds]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
