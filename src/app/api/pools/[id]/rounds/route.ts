import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { listRounds, createRound } from '@/services/round.service';
import { isOwner, isParticipant } from '@/services/pool.service';

const createSchema = z.object({
  name: z.string().min(2).max(60),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const member = await isParticipant(session.user.id, id);
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const rounds = await listRounds(id);
  return NextResponse.json(rounds);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const owner = await isOwner(session.user.id, id);
  if (!owner) return NextResponse.json({ error: 'Apenas o dono pode criar rodadas' }, { status: 403 });

  try {
    const body = await req.json();
    const { name, startDate, endDate } = createSchema.parse(body);
    const round = await createRound({ poolId: id, name, startDate: new Date(startDate), endDate: new Date(endDate) });
    return NextResponse.json(round, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
