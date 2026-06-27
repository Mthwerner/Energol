import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';

const genPassword = customAlphabet('abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789', 10);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: poolId } = await params;
  const { userId } = await req.json();

  // Verify requester is pool owner
  const pool = await prisma.pool.findUnique({ where: { id: poolId }, select: { ownerId: true } });
  if (!pool || pool.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Apenas o dono do bolão pode redefinir senhas' }, { status: 403 });
  }

  // Verify target is a participant
  const participant = await prisma.participant.findUnique({
    where: { userId_poolId: { userId, poolId } },
  });
  if (!participant) {
    return NextResponse.json({ error: 'Participante não encontrado' }, { status: 404 });
  }

  // Owner cannot reset their own password here
  if (userId === session.user.id) {
    return NextResponse.json({ error: 'Use o perfil para alterar sua própria senha' }, { status: 400 });
  }

  const tempPassword = genPassword();
  const hash = await bcrypt.hash(tempPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hash } });

  return NextResponse.json({ tempPassword });
}
