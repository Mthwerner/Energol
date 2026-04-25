import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createInvite } from '@/services/invite.service';
import { isOwner } from '@/services/pool.service';

interface Ctx { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const owner = await isOwner(session.user.id, id);
  if (!owner) return NextResponse.json({ error: 'Apenas o dono pode criar convites' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const invite = await createInvite(id, session.user.id, body.email);

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  return NextResponse.json({
    token: invite.token,
    link: `${baseUrl}/invite/${invite.token}`,
    expiresAt: invite.expiresAt,
  }, { status: 201 });
}
