import { prisma } from '@/lib/prisma';

export async function listParticipants(poolId: string) {
  return prisma.participant.findMany({
    where: { poolId, isActive: true },
    include: {
      user: { select: { id: true, name: true, email: true } },
      scores: {
        select: { totalPoints: true, exactScores: true, correctResults: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });
}

export async function removeParticipant(poolId: string, userId: string, ownerId: string) {
  // Only the pool owner can remove participants (not themselves)
  if (userId === ownerId) throw new Error('O dono não pode ser removido do bolão');

  return prisma.participant.updateMany({
    where: { poolId, userId, isActive: true },
    data: { isActive: false },
  });
}
