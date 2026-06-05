import { prisma } from '@/lib/prisma';

export async function createJoinRequest(poolId: string, userId: string) {
  const existing = await prisma.participant.findUnique({
    where: { userId_poolId: { userId, poolId } },
  });
  if (existing?.isActive) throw new Error('Você já participa deste bolão');

  const existingRequest = await prisma.joinRequest.findUnique({
    where: { userId_poolId: { userId, poolId } },
  });
  if (existingRequest?.status === 'PENDING') throw new Error('Você já tem uma solicitação pendente');
  if (existingRequest?.status === 'APPROVED') throw new Error('Sua solicitação já foi aprovada');

  if (existingRequest) {
    return prisma.joinRequest.update({
      where: { id: existingRequest.id },
      data: { status: 'PENDING', updatedAt: new Date() },
    });
  }

  return prisma.joinRequest.create({ data: { poolId, userId } });
}

export async function listPendingRequests(poolId: string) {
  return prisma.joinRequest.findMany({
    where: { poolId, status: 'PENDING' },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function approveJoinRequest(requestId: string, ownerId: string) {
  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: { pool: { select: { ownerId: true } } },
  });
  if (!request) throw new Error('Solicitação não encontrada');
  if (request.pool.ownerId !== ownerId) throw new Error('Não autorizado');
  if (request.status !== 'PENDING') throw new Error('Solicitação já processada');

  return prisma.$transaction(async (tx) => {
    const existing = await tx.participant.findUnique({
      where: { userId_poolId: { userId: request.userId, poolId: request.poolId } },
    });
    if (existing) {
      await tx.participant.update({ where: { id: existing.id }, data: { isActive: true } });
    } else {
      await tx.participant.create({ data: { userId: request.userId, poolId: request.poolId } });
    }
    return tx.joinRequest.update({ where: { id: requestId }, data: { status: 'APPROVED' } });
  });
}

export async function rejectJoinRequest(requestId: string, ownerId: string) {
  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: { pool: { select: { ownerId: true } } },
  });
  if (!request) throw new Error('Solicitação não encontrada');
  if (request.pool.ownerId !== ownerId) throw new Error('Não autorizado');
  if (request.status !== 'PENDING') throw new Error('Solicitação já processada');

  return prisma.joinRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
}

export async function getJoinRequest(poolId: string, userId: string) {
  return prisma.joinRequest.findUnique({
    where: { userId_poolId: { userId, poolId } },
  });
}

export async function countPendingRequests(poolId: string) {
  return prisma.joinRequest.count({ where: { poolId, status: 'PENDING' } });
}
