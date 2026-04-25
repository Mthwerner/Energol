import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { setGameResult } from '@/services/result.service';
import { prisma } from '@/lib/prisma';
import { isOwner } from '@/services/pool.service';

const schema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  reason: z.string().max(200).optional(),
});

interface Ctx { params: Promise<{ gameId: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { gameId } = await params;

  // Find which pool owns this game
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { round: { select: { poolId: true } } },
  });

  if (!game) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });

  const owner = await isOwner(session.user.id, game.round.poolId);
  if (!owner) return NextResponse.json({ error: 'Apenas o dono pode inserir resultados' }, { status: 403 });

  try {
    const body = await req.json();
    const { homeScore, awayScore, reason } = schema.parse(body);
    await setGameResult(gameId, homeScore, awayScore, session.user.id, reason);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
