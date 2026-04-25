/**
 * Sync de Resultados – Brasileirão 2026 e Copa do Mundo 2026
 *
 * Busca os jogos finalizados na API, calcula os pontos de cada palpite
 * e atualiza a classificação de cada rodada automaticamente.
 *
 * Uso:
 *   npm run sync:brasileirao   ← Brasileirão Série A 2026
 *   npm run sync:copa          ← Copa do Mundo FIFA 2026
 *   npm run sync:all           ← ambos de uma vez
 */

import { PrismaClient, GameStatus, RoundStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
import {
  fetchBR2026Matches,
  fetchWC2026Matches,
  getRoundDef,
  BSA2026_ROUNDS,
  WC2026_ROUNDS,
  type FDMatch,
} from '../src/lib/football-data';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

// ─── Scoring ──────────────────────────────────────────────────────────────────

function calcPoints(pred: { homeScore: number; awayScore: number }, actual: { homeScore: number; awayScore: number }): number {
  if (pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore) return 10;
  const outcome = (h: number, a: number) => h > a ? 'H' : h < a ? 'A' : 'D';
  if (outcome(pred.homeScore, pred.awayScore) === outcome(actual.homeScore, actual.awayScore)) return 5;
  return 0;
}

// ─── Sync de um único jogo ────────────────────────────────────────────────────

async function syncGame(match: FDMatch): Promise<'updated' | 'skipped' | 'not_found'> {
  const homeScore = match.score.fullTime.home;
  const awayScore = match.score.fullTime.away;

  if (homeScore === null || awayScore === null) return 'skipped';

  const game = await prisma.game.findUnique({
    where: { externalId: match.id },
    include: { round: true },
  });

  if (!game) return 'not_found';

  // Já está sincronizado com o mesmo placar — pular
  if (
    game.status === GameStatus.FINISHED &&
    game.homeScore === homeScore &&
    game.awayScore === awayScore
  ) return 'skipped';

  await prisma.$transaction(async (tx) => {
    // 1. Atualizar jogo
    await tx.game.update({
      where: { id: game.id },
      data: { homeScore, awayScore, status: GameStatus.FINISHED },
    });

    // 2. Calcular pontos de cada palpite
    const predictions = await tx.prediction.findMany({ where: { gameId: game.id } });
    for (const pred of predictions) {
      const points = calcPoints(
        { homeScore: pred.homeScore, awayScore: pred.awayScore },
        { homeScore, awayScore },
      );
      await tx.prediction.update({ where: { id: pred.id }, data: { points } });
    }

    // 3. Verificar se toda a rodada terminou
    const allGames = await tx.game.findMany({ where: { roundId: game.roundId } });
    const allFinished = allGames.every((g) => g.status === GameStatus.FINISHED || g.id === game.id);

    if (allFinished && game.round.status !== RoundStatus.FINISHED) {
      await tx.round.update({
        where: { id: game.roundId },
        data: { status: RoundStatus.FINISHED },
      });

      // 4. Recalcular ParticipantScore da rodada
      const participants = await tx.participant.findMany({
        where: { pool: { rounds: { some: { id: game.roundId } } }, isActive: true },
      });
      const allPreds = await tx.prediction.findMany({ where: { game: { roundId: game.roundId } } });

      for (const part of participants) {
        const userPreds = allPreds.filter((p) => p.userId === part.userId);
        const totalPoints    = userPreds.reduce((s, p) => s + (p.points ?? 0), 0);
        const exactScores    = userPreds.filter((p) => p.points === 10).length;
        const correctResults = userPreds.filter((p) => p.points === 5).length;

        await tx.participantScore.upsert({
          where:  { participantId_roundId: { participantId: part.id, roundId: game.roundId } },
          update: { totalPoints, exactScores, correctResults },
          create: { participantId: part.id, roundId: game.roundId, totalPoints, exactScores, correctResults },
        });
      }

      console.log(`   🏁 Rodada finalizada: ${game.round.name}`);
    }
  });

  return 'updated';
}

// ─── Sync de uma competição ───────────────────────────────────────────────────

async function syncCompetition(
  label: string,
  fetchMatches: () => Promise<FDMatch[]>,
  rounds: typeof BSA2026_ROUNDS,
) {
  console.log(`\n📡 Buscando resultados: ${label}...`);
  const allMatches = await fetchMatches();
  const finished   = allMatches.filter((m) => m.status === 'FINISHED' || m.status === 'AWARDED');
  console.log(`   ${finished.length} jogo(s) finalizado(s) na API\n`);

  let updated   = 0;
  let skipped   = 0;
  let notFound  = 0;

  // Agrupar por rodada para exibir progresso
  const byRound = new Map<string, FDMatch[]>();
  for (const m of finished) {
    const def = getRoundDef(m, rounds);
    if (!def) continue;
    const key = def.name;
    if (!byRound.has(key)) byRound.set(key, []);
    byRound.get(key)!.push(m);
  }

  for (const [roundName, matches] of byRound) {
    let roundUpdated = 0;
    for (const m of matches) {
      const result = await syncGame(m);
      if (result === 'updated')   { updated++;  roundUpdated++; }
      if (result === 'skipped')   skipped++;
      if (result === 'not_found') notFound++;
    }
    if (roundUpdated > 0) {
      console.log(`   ✅ ${roundName}: ${roundUpdated} resultado(s) sincronizado(s)`);
    }
  }

  console.log(`\n   Resumo: ${updated} atualizados · ${skipped} já sincronizados · ${notFound} não encontrados`);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2] ?? 'all';

  console.log('🔄 Sync de resultados iniciado...');
  console.log(`   Banco: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] ?? 'local'}\n`);

  if (arg === 'brasileirao' || arg === 'all') {
    await syncCompetition('Brasileirão Série A 2026', fetchBR2026Matches, BSA2026_ROUNDS);
  }

  if (arg === 'copa' || arg === 'all') {
    await syncCompetition('Copa do Mundo FIFA 2026', fetchWC2026Matches, WC2026_ROUNDS);
  }

  console.log('\n✅ Sync concluído!\n');
}

main()
  .catch((e) => { console.error('\n❌ Erro:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
