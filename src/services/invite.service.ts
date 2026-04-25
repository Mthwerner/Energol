import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { addDays } from 'date-fns';

export async function createInvite(poolId: string, senderId: string, email?: string) {
  const token = nanoid(32);
  const expiresAt = addDays(new Date(), 7);

  return prisma.invite.create({
    data: { token, poolId, senderId, email, expiresAt },
  });
}

export async function getInviteByToken(token: string) {
  return prisma.invite.findUnique({
    where: { token },
    include: {
      pool: { select: { id: true, name: true, description: true } },
      sender: { select: { name: true } },
    },
  });
}

export async function acceptInvite(token: string, userId: string) {
  const invite = await prisma.invite.findUnique({ where: { token } });

  if (!invite) throw new Error('Convite não encontrado');
  if (invite.status !== 'PENDING') throw new Error('Convite já utilizado ou expirado');
  if (invite.expiresAt < new Date()) throw new Error('Convite expirado');

  // Check if already participant
  const existing = await prisma.participant.findUnique({
    where: { userId_poolId: { userId, poolId: invite.poolId } },
  });

  if (existing?.isActive) throw new Error('Você já participa deste bolão');

  return prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.participant.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    } else {
      await tx.participant.create({
        data: { userId, poolId: invite.poolId },
      });
    }

    await tx.invite.update({
      where: { token },
      data: { status: 'USED', usedAt: new Date() },
    });

    return invite.poolId;
  });
}
