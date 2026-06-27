/**
 * GET /api/cron/sync-results
 *
 * Chamado pelo cron da Vercel (vercel.json) para atualizar automaticamente
 * resultados de todos os bolões ativos que possuem rodadas abertas ou em progresso.
 *
 * Busca os dados da football-data.org uma vez por competição (BSA / WC)
 * e processa todos os bolões que usam aquela competição.
 *
 * Proteção: header Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
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

const CRON_USER = 'system:cron';

const WC_KEYWORDS = ['Fase', 'Final', 'Oitavas', 'Quartas', 'Semifinais', 'Rodada de 32'];

export async function GET(req: NextRequest) {
  // Verificar CRON_SECRET
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Buscar bolões ativos com pelo menos uma rodada não finalizada
    const pools = await prisma.pool.findMany({
      where: {
        isActive: true,
        rounds: { some: { status: { in: [RoundStatus.OPEN, RoundStatus.IN_PROGRESS] } } },
      },
      select: { id: true },
    });

    if (pools.length === 0) {
      return NextResponse.json({ ok: true, message: 'Nenhum bolão ativo para sincronizar' });
    }

    // Detectar competição de cada bolão
    const wcPoolIds: string[] = [];
    const bsaPoolIds: string[] = [];

    for (const pool of pools) {
      const wcRound = await prisma.round.findFirst({
        where: { poolId: pool.id, OR: WC_KEYWORDS.map((k) => ({ name: { contains: k } })) },
        select: { id: true },
      });
      if (wcRound) wcPoolIds.push(pool.id);
      else bsaPoolIds.push(pool.id);
    }

    // Buscar partidas da API uma vez por competição
    const [wcMatches, bsaMatches] = await Promise.all([
      wcPoolIds.length > 0 ? fetchWC2026Matches() : Promise.resolve<FDMatch[]>([]),
      bsaPoolIds.length > 0 ? fetchBR2026Matches() : Promise.resolve<FDMatch[]>([]),
    ]);

    const results: Record<string, unknown> = {};

    // Processar cada bolão
    const allPools = [
      ...wcPoolIds.map((id) => ({ id, competition: 'WC2026' as const, matches: wcMatches })),
      ...bsaPoolIds.map((id) => ({ id, competition: 'BSA2026' as const, matches: bsaMatches })),
    ];

    for (const { id: poolId, competition, matches } of allPools) {
      const roundDefs: RoundDef[] = competition === 'WC2026' ? WC2026_ROUNDS : BSA2026_ROUNDS;

      const byRound = new Map<number, FDMatch[]>();
      for (const match of matches) {
        const def = getRoundDef(match, roundDefs);
        if (!def) continue;
        if (!byRound.has(def.number)) byRound.set(def.number, []);
        byRound.get(def.number)!.push(match);
      }

      let gamesUpdated = 0;
      let newResults = 0;

      for (const def of roundDefs) {
        const roundMatches = byRound.get(def.number) ?? [];
        if (roundMatches.length === 0) continue;

        const start = minDate(roundMatches);
        const end = maxDate(roundMatches);

        const allFinished = roundMatches.every(
          (m) => m.status === 'FINISHED' || m.status === 'AWARDED',
        );
        const anyStarted = roundMatches.some(
          (m) =>
            m.status === 'IN_PLAY' ||
            m.status === 'PAUSED' ||
            m.status === 'FINISHED' ||
            m.status === 'AWARDED',
        );
        const roundStatus: RoundStatus = allFinished
          ? RoundStatus.FINISHED
          : anyStarted
            ? RoundStatus.IN_PROGRESS
            : RoundStatus.OPEN;

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

        for (const m of roundMatches) {
          const homeTeamApi = m.homeTeam?.shortName || m.homeTeam?.name || null;
          const awayTeamApi = m.awayTeam?.shortName || m.awayTeam?.name || null;
          const homeCrest = m.homeTeam?.crest || null;
          const awayCrest = m.awayTeam?.crest || null;
          const matchDate = new Date(m.utcDate);
          const status = toGameStatus(m.status) as GameStatus;
          const group = m.group ?? null;

          // Busca o jogo filtrando pelo pool — externalId não é único globalmente
          let existingGame = await prisma.game.findFirst({
            where: { externalId: m.id, round: { poolId } },
          });
          if (!existingGame) {
            existingGame = await prisma.game.findFirst({
              where: { roundId: round.id, externalId: null, matchDate },
            }) ?? null;
            if (existingGame) {
              await prisma.game.update({ where: { id: existingGame.id }, data: { externalId: m.id } });
            }
          }

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
              CRON_USER,
            );
            newResults++;
          }

          const teamUpdate: { homeTeam?: string; homeCrest?: string | null; awayTeam?: string; awayCrest?: string | null } = {};
          if (homeTeamApi) { teamUpdate.homeTeam = homeTeamApi; teamUpdate.homeCrest = homeCrest; }
          if (awayTeamApi) { teamUpdate.awayTeam = awayTeamApi; teamUpdate.awayCrest = awayCrest; }

          if (existingGame) {
            await prisma.game.update({
              where: { id: existingGame.id },
              data: {
                ...teamUpdate,
                matchDate, status, group,
                homeScore: status === 'FINISHED' ? m.score.fullTime.home : null,
                awayScore: status === 'FINISHED' ? m.score.fullTime.away : null,
              },
            });
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
          }

          gamesUpdated++;
        }

        if (allFinished) {
          await recalculateRoundResults(round.id);
        }
      }

      revalidateTag(competition === 'WC2026' ? 'standings-WC' : 'standings-BSA');
      revalidateTag(competition === 'WC2026' ? 'scorers-WC' : 'scorers-BSA');

      results[poolId] = { competition, gamesUpdated, newResults };
    }

    console.log('[cron:sync-results]', JSON.stringify(results));

    return NextResponse.json({ ok: true, synced: allPools.length, results });
  } catch (err) {
    console.error('[cron:sync-results]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
