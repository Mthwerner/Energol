import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPool, isParticipant } from '@/services/pool.service';
import { getPoolRoundRankings } from '@/services/ranking.service';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Medal, Trophy } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { RoundRankingAccordion } from './round-ranking-accordion';

export const metadata: Metadata = { title: 'Ranking por Rodada' };

interface Props { params: Promise<{ id: string }> }

export default async function RoundRankingPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, member] = await Promise.all([getPool(id), isParticipant(session.user.id, id)]);

  if (!pool || !pool.isActive) notFound();
  if (!member) redirect(`/pools/${id}`);

  const rounds = await getPoolRoundRankings(id);

  return (
    <div>
      <Header
        title="Ranking por Rodada"
        description={pool.name}
        actions={
          <Link href={`/pools/${id}/ranking`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} /> Ranking geral
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-6 space-y-4">
        {rounds.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-slate-500">
              <Trophy size={32} className="mx-auto mb-3 text-slate-700" />
              <p>Nenhuma rodada finalizada ainda</p>
            </CardContent>
          </Card>
        ) : (
          <RoundRankingAccordion rounds={rounds} currentUserId={session.user.id} />
        )}
      </div>
    </div>
  );
}
