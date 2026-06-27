import { prisma } from '@/lib/prisma';
import { RoundStatus } from '@prisma/client';

export async function listRounds(poolId: string) {
  return prisma.round.findMany({
    where: { poolId },
    include: {
      _count: { select: { games: true } },
    },
    orderBy: { number: 'asc' },
  });
}

export async function getRound(roundId: string) {
  return prisma.round.findUnique({
    where: { id: roundId },
    include: {
      games: { orderBy: { matchDate: 'asc' } },
      _count: { select: { games: true } },
    },
  });
}

export async function createRound(data: {
  poolId: string;
  name: string;
  startDate: Date;
  endDate: Date;
}) {
  const lastRound = await prisma.round.findFirst({
    where: { poolId: data.poolId },
    orderBy: { number: 'desc' },
  });

  const number = (lastRound?.number ?? 0) + 1;

  return prisma.round.create({
    data: { ...data, number },
  });
}

export async function updateRound(
  roundId: string,
  data: { name?: string; startDate?: Date; endDate?: Date; status?: RoundStatus },
) {
  return prisma.round.update({ where: { id: roundId }, data });
}

export async function closeRound(roundId: string) {
  return prisma.round.update({
    where: { id: roundId },
    data: { status: RoundStatus.CLOSED },
  });
}
