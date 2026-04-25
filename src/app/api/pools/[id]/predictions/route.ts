import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getUserPredictionsForPool, savePredictions } from '@/services/prediction.service';
import { isParticipant } from '@/services/pool.service';
import { prisma } from '@/lib/prisma';

const PREDICTION_CUTOFF_MS = 60 * 60 * 1000; // 1 hour in ms

const saveSchema = z.object({
  predictions: z.array(
    z.object({
      gameId: z.string(),
      homeScore: z.number().int().min(0),
      awayScore: z.number().int().min(0),
    }),
  ),
});

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const member = await isParticipant(session.user.id, id);
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const predictions = await getUserPredictionsForPool(session.user.id, id);
  return NextResponse.json(predictions);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const member = await isParticipant(session.user.id, id);
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const body = await req.json();
    const { predictions } = saveSchema.parse(body);

    const gameIds = predictions.map((p) => p.gameId);
    const games = await prisma.game.findMany({ where: { id: { in: gameIds } }, select: { id: true, matchDate: true } });
    const gameMap = new Map(games.map((g) => [g.id, g]));

    const cutoff = new Date(Date.now() + PREDICTION_CUTOFF_MS);
    const valid = predictions.filter((p) => {
      const game = gameMap.get(p.gameId);
      return game && game.matchDate > cutoff;
    });

    if (valid.length === 0) {
      return NextResponse.json({ error: 'Palpites encerrados: todos os jogos começam em menos de 1 hora' }, { status: 400 });
    }

    const result = await savePredictions(session.user.id, valid);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
