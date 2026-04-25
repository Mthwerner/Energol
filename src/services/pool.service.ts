import { prisma } from '@/lib/prisma';

export async function listUserPools(userId: string) {
  return prisma.pool.findMany({
    where: {
      isActive: true,
      participants: { some: { userId, isActive: true } },
    },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { participants: true, rounds: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPool(poolId: string) {
  return prisma.pool.findUnique({
    where: { id: poolId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { participants: true, rounds: true } },
    },
  });
}

export async function createPool(data: { name: string; description?: string; ownerId: string }) {
  return prisma.$transaction(async (tx) => {
    const pool = await tx.pool.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
      },
    });

    // Owner automatically becomes a participant
    await tx.participant.create({
      data: { userId: data.ownerId, poolId: pool.id },
    });

    return pool;
  });
}

export async function updatePool(
  poolId: string,
  ownerId: string,
  data: { name?: string; description?: string },
) {
  return prisma.pool.updateMany({
    where: { id: poolId, ownerId },
    data,
  });
}

export async function deletePool(poolId: string, ownerId: string) {
  return prisma.pool.updateMany({
    where: { id: poolId, ownerId },
    data: { isActive: false },
  });
}

export async function isParticipant(userId: string, poolId: string) {
  const p = await prisma.participant.findUnique({
    where: { userId_poolId: { userId, poolId } },
  });
  return !!p?.isActive;
}

export async function isOwner(userId: string, poolId: string) {
  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  return pool?.ownerId === userId;
}
