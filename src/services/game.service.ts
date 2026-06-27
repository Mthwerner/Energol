import { prisma } from '@/lib/prisma';
import { GameStatus } from '@prisma/client';

export async function listGames(roundId: string) {
  return prisma.game.findMany({
    where: { roundId },
    orderBy: [{ matchDate: 'asc' }, { id: 'asc' }],
  });
}

export async function createGame(data: {
  roundId: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string;
  awayCrest?: string;
  matchDate: Date;
}) {
  return prisma.game.create({ data });
}

export async function updateGame(
  gameId: string,
  data: {
    homeTeam?: string;
    awayTeam?: string;
    homeCrest?: string;
    awayCrest?: string;
    matchDate?: Date;
    status?: GameStatus;
  },
) {
  return prisma.game.update({ where: { id: gameId }, data });
}

export async function deleteGame(gameId: string) {
  return prisma.game.delete({ where: { id: gameId } });
}
