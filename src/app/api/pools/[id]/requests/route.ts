import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isOwner } from '@/services/pool.service';
import { listPendingRequests } from '@/services/join-request.service';

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const owner = await isOwner(session.user.id, id);
  if (!owner) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const requests = await listPendingRequests(id);
  return NextResponse.json(requests);
}
