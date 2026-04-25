import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listParticipants, removeParticipant } from '@/services/participant.service';
import { isOwner, isParticipant } from '@/services/pool.service';

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const member = await isParticipant(session.user.id, id);
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const participants = await listParticipants(id);
  return NextResponse.json(participants);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const owner = await isOwner(session.user.id, id);
  if (!owner) return NextResponse.json({ error: 'Apenas o dono pode remover participantes' }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });

  try {
    await removeParticipant(id, userId, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
