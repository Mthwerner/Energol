import { PrismaClient, GameStatus, RoundStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const POOL_ID = 'pool-brasileirao-2025';
const ROUND1_ID = 'round-brasileirao-r1';
const ROUND2_ID = 'round-brasileirao-r2';

async function main() {
  console.log('🌱 Seeding database...');

  const hash = await bcrypt.hash('password123', 10);

  // ── Users ─────────────────────────────────────────────────────────────────
  const carlos = await prisma.user.upsert({
    where: { email: 'carlos@energol.com' },
    update: {},
    create: { name: 'Carlos Silva', email: 'carlos@energol.com', password: hash },
  });

  const marina = await prisma.user.upsert({
    where: { email: 'marina@energol.com' },
    update: {},
    create: { name: 'Marina Santos', email: 'marina@energol.com', password: hash },
  });

  const pedro = await prisma.user.upsert({
    where: { email: 'pedro@energol.com' },
    update: {},
    create: { name: 'Pedro Oliveira', email: 'pedro@energol.com', password: hash },
  });

  const rafael = await prisma.user.upsert({
    where: { email: 'rafael@energol.com' },
    update: {},
    create: { name: 'Rafael Costa', email: 'rafael@energol.com', password: hash },
  });

  console.log('✅ Users created');

  // ── Pool ──────────────────────────────────────────────────────────────────
  const pool = await prisma.pool.upsert({
    where: { id: POOL_ID },
    update: {},
    create: {
      id: POOL_ID,
      name: 'Bolão Brasileirão 2025',
      description: 'Bolão oficial do Campeonato Brasileiro Série A 2025',
      ownerId: carlos.id,
    },
  });

  console.log('✅ Pool created');

  // ── Participants ──────────────────────────────────────────────────────────
  for (const user of [carlos, marina, pedro, rafael]) {
    await prisma.participant.upsert({
      where: { userId_poolId: { userId: user.id, poolId: pool.id } },
      update: {},
      create: { userId: user.id, poolId: pool.id },
    });
  }

  console.log('✅ Participants created');

  // ── Round 1 (Finished) ────────────────────────────────────────────────────
  const round1 = await prisma.round.upsert({
    where: { poolId_number: { poolId: pool.id, number: 1 } },
    update: {},
    create: {
      id: ROUND1_ID,
      poolId: pool.id,
      number: 1,
      name: 'Rodada 1',
      startDate: new Date('2025-04-05T00:00:00Z'),
      endDate: new Date('2025-04-07T23:59:59Z'),
      status: RoundStatus.FINISHED,
    },
  });

  // ── Round 2 (Open) ────────────────────────────────────────────────────────
  const round2 = await prisma.round.upsert({
    where: { poolId_number: { poolId: pool.id, number: 2 } },
    update: {},
    create: {
      id: ROUND2_ID,
      poolId: pool.id,
      number: 2,
      name: 'Rodada 2',
      startDate: new Date('2025-04-12T00:00:00Z'),
      endDate: new Date('2025-04-14T23:59:59Z'),
      status: RoundStatus.OPEN,
    },
  });

  console.log('✅ Rounds created');

  // ── Games Round 1 (finished) ──────────────────────────────────────────────
  const game1 = await prisma.game.upsert({
    where: { id: 'game-r1-g1' },
    update: {},
    create: {
      id: 'game-r1-g1',
      roundId: round1.id,
      homeTeam: 'Flamengo',
      awayTeam: 'Palmeiras',
      matchDate: new Date('2025-04-05T16:00:00Z'),
      homeScore: 2,
      awayScore: 1,
      status: GameStatus.FINISHED,
    },
  });

  const game2 = await prisma.game.upsert({
    where: { id: 'game-r1-g2' },
    update: {},
    create: {
      id: 'game-r1-g2',
      roundId: round1.id,
      homeTeam: 'São Paulo',
      awayTeam: 'Corinthians',
      matchDate: new Date('2025-04-06T18:30:00Z'),
      homeScore: 0,
      awayScore: 0,
      status: GameStatus.FINISHED,
    },
  });

  const game3 = await prisma.game.upsert({
    where: { id: 'game-r1-g3' },
    update: {},
    create: {
      id: 'game-r1-g3',
      roundId: round1.id,
      homeTeam: 'Atlético-MG',
      awayTeam: 'Grêmio',
      matchDate: new Date('2025-04-07T20:00:00Z'),
      homeScore: 3,
      awayScore: 0,
      status: GameStatus.FINISHED,
    },
  });

  // ── Games Round 2 (scheduled) ─────────────────────────────────────────────
  await prisma.game.upsert({
    where: { id: 'game-r2-g1' },
    update: {},
    create: {
      id: 'game-r2-g1',
      roundId: round2.id,
      homeTeam: 'Fluminense',
      awayTeam: 'Botafogo',
      matchDate: new Date('2025-04-12T16:00:00Z'),
      status: GameStatus.SCHEDULED,
    },
  });

  await prisma.game.upsert({
    where: { id: 'game-r2-g2' },
    update: {},
    create: {
      id: 'game-r2-g2',
      roundId: round2.id,
      homeTeam: 'Santos',
      awayTeam: 'Vasco',
      matchDate: new Date('2025-04-13T18:30:00Z'),
      status: GameStatus.SCHEDULED,
    },
  });

  await prisma.game.upsert({
    where: { id: 'game-r2-g3' },
    update: {},
    create: {
      id: 'game-r2-g3',
      roundId: round2.id,
      homeTeam: 'Internacional',
      awayTeam: 'Cruzeiro',
      matchDate: new Date('2025-04-14T20:00:00Z'),
      status: GameStatus.SCHEDULED,
    },
  });

  console.log('✅ Games created');

  // ── Predictions Round 1 ───────────────────────────────────────────────────
  // carlos: 2x1 ✅ exact | 1x1 ✅ result | 2x0 ✅ result  → 10+5+5 = 20 pts
  // marina: 1x1 ✗ miss  | 0x0 ✅ exact  | 1x0 ✅ result  → 0+10+5 = 15 pts
  // pedro:  2x0 ✅ result| 1x0 ✗ miss   | 3x0 ✅ exact   → 5+0+10 = 15 pts
  // rafael: 0x2 ✗ miss  | 2x1 ✗ miss   | 1x1 ✗ miss    → 0+0+0  = 0 pts

  const predictionsR1 = [
    // carlos
    { id: 'pred-c-g1', userId: carlos.id, gameId: game1.id, homeScore: 2, awayScore: 1, points: 10 },
    { id: 'pred-c-g2', userId: carlos.id, gameId: game2.id, homeScore: 1, awayScore: 1, points: 5 },
    { id: 'pred-c-g3', userId: carlos.id, gameId: game3.id, homeScore: 2, awayScore: 0, points: 5 },
    // marina
    { id: 'pred-m-g1', userId: marina.id, gameId: game1.id, homeScore: 1, awayScore: 1, points: 0 },
    { id: 'pred-m-g2', userId: marina.id, gameId: game2.id, homeScore: 0, awayScore: 0, points: 10 },
    { id: 'pred-m-g3', userId: marina.id, gameId: game3.id, homeScore: 1, awayScore: 0, points: 5 },
    // pedro
    { id: 'pred-p-g1', userId: pedro.id, gameId: game1.id, homeScore: 2, awayScore: 0, points: 5 },
    { id: 'pred-p-g2', userId: pedro.id, gameId: game2.id, homeScore: 1, awayScore: 0, points: 0 },
    { id: 'pred-p-g3', userId: pedro.id, gameId: game3.id, homeScore: 3, awayScore: 0, points: 10 },
    // rafael
    { id: 'pred-r-g1', userId: rafael.id, gameId: game1.id, homeScore: 0, awayScore: 2, points: 0 },
    { id: 'pred-r-g2', userId: rafael.id, gameId: game2.id, homeScore: 2, awayScore: 1, points: 0 },
    { id: 'pred-r-g3', userId: rafael.id, gameId: game3.id, homeScore: 1, awayScore: 1, points: 0 },
  ];

  for (const pred of predictionsR1) {
    await prisma.prediction.upsert({
      where: { userId_gameId: { userId: pred.userId, gameId: pred.gameId } },
      update: { points: pred.points },
      create: pred,
    });
  }

  console.log('✅ Predictions created');

  // ── ParticipantScores Round 1 ─────────────────────────────────────────────
  const participants = await prisma.participant.findMany({
    where: { poolId: pool.id },
  });

  const scoreData = [
    { userId: carlos.id, totalPoints: 20, exactScores: 1, correctResults: 2 },
    { userId: marina.id, totalPoints: 15, exactScores: 1, correctResults: 1 },
    { userId: pedro.id,  totalPoints: 15, exactScores: 1, correctResults: 1 },
    { userId: rafael.id, totalPoints: 0,  exactScores: 0, correctResults: 0 },
  ];

  for (const sd of scoreData) {
    const participant = participants.find(p => p.userId === sd.userId)!;
    await prisma.participantScore.upsert({
      where: { participantId_roundId: { participantId: participant.id, roundId: round1.id } },
      update: { totalPoints: sd.totalPoints, exactScores: sd.exactScores, correctResults: sd.correctResults },
      create: {
        participantId: participant.id,
        roundId: round1.id,
        totalPoints: sd.totalPoints,
        exactScores: sd.exactScores,
        correctResults: sd.correctResults,
      },
    });
  }

  console.log('✅ ParticipantScores created');
  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\nCredenciais de acesso (senha: password123):');
  console.log('  carlos@energol.com  (dono do bolão)');
  console.log('  marina@energol.com');
  console.log('  pedro@energol.com');
  console.log('  rafael@energol.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
