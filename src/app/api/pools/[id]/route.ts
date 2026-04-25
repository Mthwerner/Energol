import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getPool, updatePool, deletePool, isParticipant } from '@/services/pool.service';

const updateSchema = z.object({
  name: z.string().min(3).max(80).optional(),
  description: z.string().max(200).optional(),
});

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const pool = await getPool(id);
  if (!pool || !pool.isActive) return NextResponse.json({ error: 'Bolão não encontrado' }, { status: 404 });

  const member = await isParticipant(session.user.id, id);
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  return NextResponse.json(pool);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    const result = await updatePool(id, session.user.id, data);
    if (result.count === 0) return NextResponse.json({ error: 'Não autorizado ou bolão não encontrado' }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const result = await deletePool(id, session.user.id);
  if (result.count === 0) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  return NextResponse.json({ ok: true });
}
