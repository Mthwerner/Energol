/**
 * POST /api/admin/sync-wc2026
 *
 * Sincroniza todos os jogos da Copa 2026 com a football-data.org:
 * - Atualiza placar dos jogos já finalizados
 * - Atualiza status dos jogos (SCHEDULED → LIVE → FINISHED)
 * - Atualiza emblemas e nomes de seleções (oitavas em diante)
 * - Recalcula pontuações das rodadas encerradas
 *
 * Apenas ADMIN pode chamar esta rota.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  fetchWC2026Matches,
  getRoundDef,
  toGameStatus,
  type FDMatch,
} from '@/lib/football-data';
import { setGameResult } from '@/services/result.service';
import { GameStatus } from '@prisma/client';

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Verificar se é admin (role ADMIN no banco)
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
  }

  try {
    const allMatches = await fetchWC2026Matches();

    let updated    = 0;
    let newResults = 0;
    let skipped    = 0;

    for (const m of allMatches) {
      // Apenas processa jogos que já temos no banco (externalId)
      const game = await prisma.game.findUnique({ where: { externalId: m.id } });
      if (!game) { skipped++; continue; }

      const newStatus  = toGameStatus(m.status) as GameStatus;
      const homeTeam   = m.homeTeam?.shortName ?? m.homeTeam?.name ?? game.homeTeam;
      const awayTeam   = m.awayTeam?.shortName ?? m.awayTeam?.name ?? game.awayTeam;
      const homeCrest  = m.homeTeam?.crest ?? game.homeCrest;
      const awayCrest  = m.awayTeam?.crest ?? game.awayCrest;
      const matchDate  = new Date(m.utcDate);
      const group      = m.group ?? null;

      // Se o jogo acabou e ainda não temos placar → calcular pontuações
      if (
        newStatus === 'FINISHED' &&
        game.status !== 'FINISHED' &&
        m.score.fullTime.home !== null &&
        m.score.fullTime.away !== null
      ) {
        await setGameResult(
          game.id,
          m.score.fullTime.home,
          m.score.fullTime.away,
          session.user.id,
        );
        newResults++;
      }

      // Atualiza metadados (time, emblema, data, status)
      await prisma.game.update({
        where: { id: game.id },
        data:  { homeTeam, awayTeam, homeCrest, awayCrest, matchDate, status: newStatus, group },
      });

      updated++;
    }

    return NextResponse.json({
      ok: true,
      summary: {
        total:      allMatches.length,
        updated,
        newResults,
        skipped,
      },
    });
  } catch (err) {
    console.error('[sync-wc2026]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
