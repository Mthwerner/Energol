import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPoolRanking } from '@/services/ranking.service';
import { isParticipant } from '@/services/pool.service';

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const member = await isParticipant(session.user.id, id);
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const ranking = await getPoolRanking(id);
  return NextResponse.json(ranking);
}
