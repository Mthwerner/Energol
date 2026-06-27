import { prisma } from '@/lib/prisma';

export interface ParticipantRoundData {
  userId: string;
  name: string;
  totalPoints: number;
  predictions: Record<string, { homeScore: number; awayScore: number; points: number | null; basePoints: number | null }>;
}

export async function getRoundParticipantsPredictions(
  roundId: string,
  poolId: string,
): Promise<ParticipantRoundData[]> {
  const [participants, predictions] = await Promise.all([
    prisma.participant.findMany({
      where: { poolId, isActive: true },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.prediction.findMany({
      where: { game: { roundId } },
      select: { userId: true, gameId: true, homeScore: true, awayScore: true, points: true, basePoints: true },
    }),
  ]);

  const predMap = new Map<string, Record<string, { homeScore: number; awayScore: number; points: number | null; basePoints: number | null }>>();
  for (const pred of predictions) {
    if (!predMap.has(pred.userId)) predMap.set(pred.userId, {});
    predMap.get(pred.userId)![pred.gameId] = {
      homeScore: pred.homeScore,
      awayScore: pred.awayScore,
      points: pred.points,
      basePoints: pred.basePoints,
    };
  }

  return participants
    .map((p) => {
      const userPreds = predMap.get(p.userId) ?? {};
      const totalPoints = Object.values(userPreds).reduce((sum, pred) => sum + (pred.points ?? 0), 0);
      return {
        userId: p.userId,
        name: p.user.name ?? 'Usuário',
        totalPoints,
        predictions: userPreds,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export async function getUserPredictionsForRound(userId: string, roundId: string) {
  return prisma.prediction.findMany({
    where: {
      userId,
      game: { roundId },
    },
    include: {
      game: true,
    },
  });
}

export async function getUserPredictionsForPool(userId: string, poolId: string) {
  return prisma.prediction.findMany({
    where: {
      userId,
      game: { round: { poolId } },
    },
    include: {
      game: { include: { round: true } },
    },
    orderBy: [{ game: { matchDate: 'asc' } }, { game: { id: 'asc' } }],
  });
}

export interface PredictionInput {
  gameId: string;
  homeScore: number;
  awayScore: number;
}

export async function savePredictions(userId: string, predictions: PredictionInput[]) {
  const results = await Promise.all(
    predictions.map((p) =>
      prisma.prediction.upsert({
        where: { userId_gameId: { userId, gameId: p.gameId } },
        update: { homeScore: p.homeScore, awayScore: p.awayScore },
        create: { userId, gameId: p.gameId, homeScore: p.homeScore, awayScore: p.awayScore },
      }),
    ),
  );
  return results;
}
