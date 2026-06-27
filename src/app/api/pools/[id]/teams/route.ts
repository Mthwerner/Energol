import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isParticipant } from '@/services/pool.service';
import { prisma } from '@/lib/prisma';

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const member = await isParticipant(session.user.id, id);
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const games = await prisma.game.findMany({
    where: { round: { poolId: id } },
    select: { homeTeam: true, awayTeam: true, homeCrest: true, awayCrest: true },
  });

  const teamMap = new Map<string, string | null>();
  for (const g of games) {
    if (g.homeTeam && g.homeTeam !== 'A definir') teamMap.set(g.homeTeam, g.homeCrest ?? null);
    if (g.awayTeam && g.awayTeam !== 'A definir') teamMap.set(g.awayTeam, g.awayCrest ?? null);
  }

  const teams = Array.from(teamMap.entries())
    .map(([name, crest]) => ({ name, crest }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json(teams);
}
