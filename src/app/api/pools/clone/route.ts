/**
 * POST /api/pools/clone
 *
 * Cria um novo bolão copiando todas as rodadas e jogos de um bolão template.
 * Não copia participantes, palpites nem pontuações.
 *
 * Body: { sourcePoolId: string; name: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  sourcePoolId: z.string().min(1),
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(80),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { sourcePoolId, name } = parsed.data;

  const source = await prisma.pool.findUnique({
    where: { id: sourcePoolId },
    include: {
      rounds: {
        orderBy: { number: 'asc' },
        include: {
          games: { orderBy: { matchDate: 'asc' } },
        },
      },
    },
  });

  if (!source) {
    return NextResponse.json({ error: 'Bolão template não encontrado' }, { status: 404 });
  }

  const newPool = await prisma.$transaction(async (tx) => {
    // Criar o novo bolão
    const pool = await tx.pool.create({
      data: {
        name,
        description: source.description ?? undefined,
        ownerId: session.user.id,
      },
    });

    // Dono vira participante automaticamente
    await tx.participant.create({
      data: { userId: session.user.id, poolId: pool.id },
    });

    // Copiar rodadas e jogos
    for (const round of source.rounds) {
      const newRound = await tx.round.create({
        data: {
          poolId:    pool.id,
          number:    round.number,
          name:      round.name,
          startDate: round.startDate,
          endDate:   round.endDate,
          status:    round.status,
        },
      });

      if (round.games.length > 0) {
        await tx.game.createMany({
          data: round.games.map((g) => ({
            roundId:    newRound.id,
            externalId: null,          // sem vínculo com API externa
            homeTeam:   g.homeTeam,
            awayTeam:   g.awayTeam,
            homeCrest:  g.homeCrest,
            awayCrest:  g.awayCrest,
            matchDate:  g.matchDate,
            homeScore:  g.homeScore,
            awayScore:  g.awayScore,
            status:     g.status,
          })),
        });
      }
    }

    return pool;
  });

  return NextResponse.json(newPool, { status: 201 });
}
