import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPoolByInviteCode } from '@/services/pool.service';
import { createJoinRequest, getJoinRequest } from '@/services/join-request.service';

interface Ctx { params: Promise<{ code: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { code } = await params;
  const pool = await getPoolByInviteCode(code);
  if (!pool || !pool.isActive) {
    return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 });
  }
  return NextResponse.json({ id: pool.id, name: pool.name, description: pool.description, ownerName: pool.owner.name });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { code } = await params;
  const pool = await getPoolByInviteCode(code);
  if (!pool || !pool.isActive) {
    return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 });
  }

  try {
    await createJoinRequest(pool.id, session.user.id);
    return NextResponse.json({ ok: true, poolId: pool.id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao solicitar entrada';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
