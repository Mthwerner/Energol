import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getRound, updateRound } from '@/services/round.service';
import { isOwner, isParticipant } from '@/services/pool.service';
import { RoundStatus } from '@prisma/client';

const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.nativeEnum(RoundStatus).optional(),
});

interface Ctx { params: Promise<{ id: string; roundId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id, roundId } = await params;
  const member = await isParticipant(session.user.id, id);
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const round = await getRound(roundId);
  if (!round) return NextResponse.json({ error: 'Rodada não encontrada' }, { status: 404 });

  return NextResponse.json(round);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id, roundId } = await params;
  const owner = await isOwner(session.user.id, id);
  if (!owner) return NextResponse.json({ error: 'Apenas o dono pode editar rodadas' }, { status: 403 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const round = await updateRound(roundId, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
    return NextResponse.json(round);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
