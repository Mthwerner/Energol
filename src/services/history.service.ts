import { prisma } from '@/lib/prisma';

interface GameHistory {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest: string | null;
  awayCrest: string | null;
  homeScore: number;
  awayScore: number;
  prediction: { homeScore: number; awayScore: number; points: number } | null;
}

export interface RoundHistory {
  id: string;
  name: string;
  totalPoints: number;
  exactScores: number;
  games: GameHistory[];
}

export async function getUserRoundHistory(
  userId: string,
  poolId: string,
): Promise<RoundHistory[]> {
  const rounds = await prisma.round.findMany({
    where: { poolId, status: 'FINISHED' },
    orderBy: { number: 'desc' },
    include: {
      games: {
        where: { status: 'FINISHED' },
        orderBy: [{ matchDate: 'asc' }, { id: 'asc' }],
        include: {
          predictions: {
            where: { userId },
            select: { homeScore: true, awayScore: true, points: true },
          },
        },
      },
      scores: {
        where: { participant: { userId } },
        select: { totalPoints: true, exactScores: true },
      },
    },
  });

  return rounds.map((round) => ({
    id: round.id,
    name: round.name,
    totalPoints: round.scores[0]?.totalPoints ?? 0,
    exactScores: round.scores[0]?.exactScores ?? 0,
    games: round.games.map((game) => ({
      id: game.id,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeCrest: game.homeCrest,
      awayCrest: game.awayCrest,
      homeScore: game.homeScore!,
      awayScore: game.awayScore!,
      prediction: game.predictions[0]
        ? {
            homeScore: game.predictions[0].homeScore,
            awayScore: game.predictions[0].awayScore,
            points: game.predictions[0].points ?? 0,
          }
        : null,
    })),
  }));
}
