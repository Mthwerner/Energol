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
import { ArrowLeft, ArrowRight, CheckCircle, ChevronDown } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { FinishedRoundsAccordion } from './finished-rounds-accordion';

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

  const openRounds = rounds.filter((r) => r.status === 'OPEN');
  const finishedRounds = rounds.filter((r) => r.status !== 'OPEN');

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
      <div className="p-4 md:p-6 space-y-6">

        {/* Open rounds */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Rodadas abertas
          </h2>

          {openRounds.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <CheckCircle size={28} className="mx-auto mb-2 text-slate-700" />
                <p className="text-sm text-slate-500">Nenhuma rodada aberta no momento</p>
              </CardContent>
            </Card>
          ) : (
            openRounds.map((round) => (
              <Link key={round.id} href={`/pools/${id}/predictions/${round.id}`} className="block">
                <Card className="hover:border-brand-700 transition-colors cursor-pointer border-slate-700">
                  <CardContent className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="font-semibold text-slate-100">{round.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDate(round.startDate)} — {formatDate(round.endDate)} · {round._count.games} jogo{round._count.games !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoundStatusBadge status={round.status} />
                      <ArrowRight size={16} className="text-slate-500" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </section>

        {/* Finished rounds */}
        {finishedRounds.length > 0 && (
          <FinishedRoundsAccordion poolId={id} rounds={finishedRounds} />
        )}
      </div>
    </div>
  );
}
