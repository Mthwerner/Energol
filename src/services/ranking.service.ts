import { prisma } from '@/lib/prisma';
import { buildRanking } from '@/domain/ranking';

export async function getPoolRanking(poolId: string) {
  const participants = await prisma.participant.findMany({
    where: { poolId, isActive: true },
    include: {
      user: { select: { id: true, name: true } },
      scores: { select: { totalPoints: true, exactScores: true, correctResults: true } },
    },
  });

  const entries = participants.map((p) => ({
    userId: p.user.id,
    name: p.user.name,
    totalPoints: p.scores.reduce((sum, s) => sum + s.totalPoints, 0),
    exactScores: p.scores.reduce((sum, s) => sum + s.exactScores, 0),
    correctResults: p.scores.reduce((sum, s) => sum + s.correctResults, 0),
    roundsPlayed: p.scores.length,
  }));

  return buildRanking(entries);
}

export async function getRoundRanking(roundId: string) {
  const scores = await prisma.participantScore.findMany({
    where: { roundId },
    include: {
      participant: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
    orderBy: { totalPoints: 'desc' },
  });

  return scores.map((s, idx) => ({
    position: idx + 1,
    userId: s.participant.user.id,
    name: s.participant.user.name,
    totalPoints: s.totalPoints,
    exactScores: s.exactScores,
    correctResults: s.correctResults,
  }));
}
