import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { listUserPools, createPool } from '@/services/pool.service';

const createSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(200).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const pools = await listUserPools(session.user.id);
  return NextResponse.json(pools);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description } = createSchema.parse(body);
    const pool = await createPool({ name, description, ownerId: session.user.id });
    return NextResponse.json(pool, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
