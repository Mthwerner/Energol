import { prisma } from '@/lib/prisma';

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
    orderBy: { game: { matchDate: 'asc' } },
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
