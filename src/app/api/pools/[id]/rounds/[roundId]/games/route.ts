import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { listGames, createGame } from '@/services/game.service';
import { isOwner, isParticipant } from '@/services/pool.service';

const createSchema = z.object({
  homeTeam: z.string().min(2).max(60),
  awayTeam: z.string().min(2).max(60),
  matchDate: z.string().datetime(),
});

interface Ctx { params: Promise<{ id: string; roundId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id, roundId } = await params;
  const member = await isParticipant(session.user.id, id);
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const games = await listGames(roundId);
  return NextResponse.json(games);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id, roundId } = await params;
  const owner = await isOwner(session.user.id, id);
  if (!owner) return NextResponse.json({ error: 'Apenas o dono pode adicionar jogos' }, { status: 403 });

  try {
    const body = await req.json();
    const { homeTeam, awayTeam, matchDate } = createSchema.parse(body);
    const game = await createGame({ roundId, homeTeam, awayTeam, matchDate: new Date(matchDate) });
    return NextResponse.json(game, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
