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

  // Per-tier counts from predictions (single grouped query)
  const tierCounts = await prisma.prediction.groupBy({
    by: ['userId', 'points'],
    where: {
      userId: { in: participants.map((p) => p.user.id) },
      game: { round: { poolId } },
      points: { not: null },
    },
    _count: { _all: true },
  });

  // Build a lookup: userId → { pts: count }
  const tierMap: Record<string, Record<number, number>> = {};
  for (const row of tierCounts) {
    if (row.points === null) continue;
    const uid = row.userId;
    if (!tierMap[uid]) tierMap[uid] = {};
    tierMap[uid][row.points] = row._count._all;
  }

  const entries = participants.map((p) => {
    const uid = p.user.id;
    const t = tierMap[uid] ?? {};
    return {
      userId: uid,
      name: p.user.name,
      totalPoints:     p.scores.reduce((sum, s) => sum + s.totalPoints, 0),
      exactScores:     t[10] ?? 0,
      resultDiffScores: t[7] ?? 0,
      correctResults:  t[5]  ?? 0,
      oneScores:       t[3]  ?? 0,
      roundsPlayed:    p.scores.length,
    };
  });

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

  // Per-tier counts for this round
  const userIds = scores.map((s) => s.participant.user.id);
  const tierCounts = await prisma.prediction.groupBy({
    by: ['userId', 'points'],
    where: {
      userId: { in: userIds },
      game: { roundId },
      points: { not: null },
    },
    _count: { _all: true },
  });

  const tierMap: Record<string, Record<number, number>> = {};
  for (const row of tierCounts) {
    if (row.points === null) continue;
    const uid = row.userId;
    if (!tierMap[uid]) tierMap[uid] = {};
    tierMap[uid][row.points] = row._count._all;
  }

  return scores.map((s, idx) => {
    const uid = s.participant.user.id;
    const t = tierMap[uid] ?? {};
    return {
      position:        idx + 1,
      userId:          uid,
      name:            s.participant.user.name,
      totalPoints:     s.totalPoints,
      exactScores:     t[10] ?? 0,
      resultDiffScores: t[7] ?? 0,
      correctResults:  t[5]  ?? 0,
      oneScores:       t[3]  ?? 0,
    };
  });
}
