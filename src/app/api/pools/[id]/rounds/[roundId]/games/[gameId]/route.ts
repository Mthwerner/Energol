import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { updateGame, deleteGame } from '@/services/game.service';
import { isOwner } from '@/services/pool.service';

const updateSchema = z.object({
  homeTeam: z.string().min(2).max(60).optional(),
  awayTeam: z.string().min(2).max(60).optional(),
  matchDate: z.string().datetime().optional(),
});

interface Ctx { params: Promise<{ id: string; roundId: string; gameId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id, gameId } = await params;
  const owner = await isOwner(session.user.id, id);
  if (!owner) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const game = await updateGame(gameId, {
      ...data,
      matchDate: data.matchDate ? new Date(data.matchDate) : undefined,
    });
    return NextResponse.json(game);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id, gameId } = await params;
  const owner = await isOwner(session.user.id, id);
  if (!owner) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  await deleteGame(gameId);
  return NextResponse.json({ ok: true });
}
