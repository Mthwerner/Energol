import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getInviteByToken, acceptInvite } from '@/services/invite.service';

interface Ctx { params: Promise<{ token: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });

  return NextResponse.json({
    pool: invite.pool,
    sender: invite.sender,
    status: invite.status,
    expiresAt: invite.expiresAt,
  });
}

export async function POST(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { token } = await params;

  try {
    const poolId = await acceptInvite(token, session.user.id);
    return NextResponse.json({ poolId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
