import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateInviteCode, revokeInviteCode, getInviteCode } from '@/services/pool.service';

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  try {
    const code = await getInviteCode(id, session.user.id);
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    return NextResponse.json({ code, link: code ? `${baseUrl}/join/${code}` : null });
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
}

export async function POST(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  try {
    const pool = await generateInviteCode(id, session.user.id);
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    return NextResponse.json({
      code: pool.inviteCode,
      link: `${baseUrl}/join/${pool.inviteCode}`,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  try {
    await revokeInviteCode(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
}
