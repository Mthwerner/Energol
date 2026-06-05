import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { approveJoinRequest, rejectJoinRequest } from '@/services/join-request.service';

interface Ctx { params: Promise<{ id: string; requestId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { requestId } = await params;
  const { action } = await req.json();

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  }

  try {
    if (action === 'approve') {
      await approveJoinRequest(requestId, session.user.id);
    } else {
      await rejectJoinRequest(requestId, session.user.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao processar solicitação';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
