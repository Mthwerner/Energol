import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPool, isParticipant } from '@/services/pool.service';
import { listRounds } from '@/services/round.service';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RoundStatusBadge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Palpites' };

interface Props { params: Promise<{ id: string }> }

export default async function PredictionsPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, member] = await Promise.all([getPool(id), isParticipant(session.user.id, id)]);

  if (!pool || !pool.isActive) notFound();
  if (!member) redirect(`/pools/${id}`);

  const rounds = await listRounds(id);

  return (
    <div>
      <Header
        title="Palpites"
        description={pool.name}
        actions={
          <Link href={`/pools/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} /> Voltar
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-3">
        {rounds.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              Nenhuma rodada cadastrada
            </CardContent>
          </Card>
        ) : (
          rounds.map((round) => (
            <Link key={round.id} href={`/pools/${id}/predictions/${round.id}`} className="block">
              <Card className="hover:border-slate-600 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="font-medium text-slate-100">{round.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatDate(round.startDate)} — {formatDate(round.endDate)} · {round._count.games} jogo{round._count.games !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoundStatusBadge status={round.status} />
                    <ArrowRight size={16} className="text-slate-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
