import { PrismaClient } from '@prisma/client';
import { calculateScore } from '../src/domain/scoring';

const PROD_URL = 'postgresql://neondb_owner:npg_tqSpj9bcYG8w@ep-wispy-leaf-accj9vw5.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const prisma = new PrismaClient({ datasources: { db: { url: PROD_URL } } });

async function recalcRound(roundId: string) {
  const games = await prisma.game.findMany({
    where: { roundId, status: 'FINISHED' },
    include: { predictions: true },
  });

  let predsUpdated = 0;
  for (const game of games) {
    if (game.homeScore === null || game.awayScore === null) continue;
    for (const pred of game.predictions) {
      const calc = calculateScore(
        { homeScore: pred.homeScore, awayScore: pred.awayScore },
        { homeScore: game.homeScore, awayScore: game.awayScore },
      );
      if (pred.points !== calc.points) {
        await prisma.prediction.update({ where: { id: pred.id }, data: { points: calc.points } });
        predsUpdated++;
      }
    }
  }

  const participants = await prisma.participant.findMany({
    where: { pool: { rounds: { some: { id: roundId } } }, isActive: true },
  });
  const predictions = await prisma.prediction.findMany({ where: { game: { roundId } } });

  for (const participant of participants) {
    const userPreds = predictions.filter((p) => p.userId === participant.userId);
    const totalPoints = userPreds.reduce((sum, p) => sum + (p.points ?? 0), 0);
    const exactScores = userPreds.filter((p) => p.points === 10).length;
    const correctResults = userPreds.filter((p) => p.points === 5 || p.points === 7).length;
    await prisma.participantScore.upsert({
      where: { participantId_roundId: { participantId: participant.id, roundId } },
      update: { totalPoints, exactScores, correctResults },
      create: { participantId: participant.id, roundId, totalPoints, exactScores, correctResults },
    });
  }

  return predsUpdated;
}

async function main() {
  const rounds = await prisma.round.findMany({
    where: { status: 'FINISHED' },
    select: { id: true, name: true },
  });
  console.log(`Rodadas FINISHED: ${rounds.length}`);

  let totalFixed = 0;
  for (const round of rounds) {
    const n = await recalcRound(round.id);
    if (n > 0) console.log(`  ${round.name}: ${n} predição(ões) corrigida(s)`);
    totalFixed += n;
  }
  console.log(`\nTotal predições corrigidas: ${totalFixed}`);

  // Resultado final
  const pools = await prisma.pool.findMany({ select: { id: true, name: true } });
  for (const pool of pools) {
    const participants = await prisma.participant.findMany({
      where: { poolId: pool.id, isActive: true },
      include: { user: { select: { name: true } }, scores: { select: { totalPoints: true } } },
    });
    const total = participants.reduce((s, p) => s + p.scores.reduce((a, b) => a + b.totalPoints, 0), 0);
    if (total > 0) {
      console.log(`\nPool: ${pool.name} (total: ${total} pts)`);
      for (const p of participants) {
        const pts = p.scores.reduce((a, b) => a + b.totalPoints, 0);
        if (pts > 0) console.log(`  ${p.user.name}: ${pts} pts`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
