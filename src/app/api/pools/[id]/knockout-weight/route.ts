/**
 * GET  /api/pools/[id]/knockout-weight
 *   Retorna a configuração atual de pesos e se está bloqueada para edição.
 *   Restrito ao dono do bolão.
 *
 * PATCH /api/pools/[id]/knockout-weight
 *   Atualiza a configuração de pesos. Retorna 423 se o mata-mata já começou.
 *   Restrito ao dono do bolão.
 *
 * Bloqueio (opção B): após o início da primeira rodada eliminatória (IN_PROGRESS
 * ou FINISHED), os pesos ficam travados para evitar que o ranking "ande" de forma
 * inesperada retroativamente.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isKnockoutWeightLocked } from '@/services/pool.service';

/** Fases eliminatórias — espelho de isKnockoutWeightLocked para validação */
const KNOCKOUT_STAGES = [
  'LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL',
] as const;

const patchSchema = z.object({
  knockoutWeightEnabled: z.boolean(),
  weightLast32:  z.number().int().min(1).max(20),
  weightLast16:  z.number().int().min(1).max(20),
  weightQuarter: z.number().int().min(1).max(20),
  weightSemi:    z.number().int().min(1).max(20),
  weightThird:   z.number().int().min(1).max(20),
  weightFinal:   z.number().int().min(1).max(20),
});

interface Ctx { params: Promise<{ id: string }> }

/** Verifica autoria e retorna o pool ou uma resposta de erro */
async function authorize(poolId: string, userId: string) {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    select: {
      ownerId:              true,
      knockoutWeightEnabled: true,
      weightLast32:         true,
      weightLast16:         true,
      weightQuarter:        true,
      weightSemi:           true,
      weightThird:          true,
      weightFinal:          true,
    },
  });
  if (!pool) return { pool: null, error: NextResponse.json({ error: 'Bolão não encontrado' }, { status: 404 }) };
  if (pool.ownerId !== userId) return { pool: null, error: NextResponse.json({ error: 'Acesso restrito ao dono do bolão' }, { status: 403 }) };
  return { pool, error: null };
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const { pool, error } = await authorize(id, session.user.id);
  if (error) return error;

  const locked = await isKnockoutWeightLocked(id);

  return NextResponse.json({ ...pool, locked });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const { pool, error } = await authorize(id, session.user.id);
  if (error) return error;

  // Bloqueio: mata-mata já iniciou — não permite alteração para evitar
  // que o ranking mude retroativamente de forma inesperada.
  const locked = await isKnockoutWeightLocked(id);
  if (locked) {
    return NextResponse.json(
      { error: 'Os pesos não podem ser alterados após o início das fases eliminatórias.' },
      { status: 423 }, // 423 Locked
    );
  }

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);
    await prisma.pool.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

