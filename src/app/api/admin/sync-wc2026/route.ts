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
 * Como externalId não é mais único globalmente (cada bolão tem suas cópias),
 * usa findMany para atualizar todos os jogos com o mesmo externalId.
 */

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  fetchWC2026Matches,
  toGameStatus,
} from '@/lib/football-data';
import { setGameResult } from '@/services/result.service';
import { GameStatus } from '@prisma/client';

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

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
      // Busca todos os jogos com este externalId (um por bolão)
      const games = await prisma.game.findMany({ where: { externalId: m.id } });
      if (games.length === 0) { skipped++; continue; }

      const newStatus = toGameStatus(m.status) as GameStatus;
      const homeTeamApi = m.homeTeam?.shortName || m.homeTeam?.name || null;
      const awayTeamApi = m.awayTeam?.shortName || m.awayTeam?.name || null;
      const homeCrest = m.homeTeam?.crest || null;
      const awayCrest = m.awayTeam?.crest || null;
      const matchDate = new Date(m.utcDate);
      const group = m.group ?? null;

      for (const game of games) {
        const alreadyFinished = game.status === 'FINISHED' && game.homeScore !== null;

        if (
          newStatus === 'FINISHED' &&
          !alreadyFinished &&
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

        // Não atualiza homeTeam/awayTeam de jogo já finalizado — a API pode ter
        // home/away na ordem oposta à usada quando os palpites foram feitos.
        const teamUpdate: { homeTeam?: string; homeCrest?: string | null; awayTeam?: string; awayCrest?: string | null } = {};
        if (!alreadyFinished) {
          if (homeTeamApi) { teamUpdate.homeTeam = homeTeamApi; teamUpdate.homeCrest = homeCrest; }
          if (awayTeamApi) { teamUpdate.awayTeam = awayTeamApi; teamUpdate.awayCrest = awayCrest; }
        }

        await prisma.game.update({
          where: { id: game.id },
          data: {
            ...teamUpdate,
            matchDate,
            status: newStatus,
            group,
          },
        });
      }

      updated += games.length;
    }

    revalidateTag('standings-WC');
    revalidateTag('scorers-WC');

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
