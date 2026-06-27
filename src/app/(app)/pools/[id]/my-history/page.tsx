import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPool, isParticipant } from '@/services/pool.service';
import { getUserRoundHistory } from '@/services/history.service';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History } from 'lucide-react';
import { RoundHistoryAccordion } from './round-history-accordion';

export const metadata: Metadata = { title: 'Meus Palpites' };

interface Props { params: Promise<{ id: string }> }

export default async function MyHistoryPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, member] = await Promise.all([getPool(id), isParticipant(session.user.id, id)]);

  if (!pool || !pool.isActive) notFound();
  if (!member) redirect(`/pools/${id}`);

  const history = await getUserRoundHistory(session.user.id, id);

  const totalPoints = history.reduce((s, r) => s + r.totalPoints, 0);
  const totalExact  = history.reduce((s, r) => s + r.exactScores, 0);
  const totalGames  = history.reduce((s, r) => s + r.games.length, 0);
  const totalPreds  = history.reduce((s, r) => s + r.games.filter((g) => g.prediction).length, 0);

  return (
    <div>
      <Header
        title="Meus Palpites"
        description={pool.name}
        actions={
          <Link href={`/pools/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} /> Voltar
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-6 space-y-5">
        {history.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-slate-500">
              <History size={32} className="mx-auto mb-3 text-slate-700" />
              <p>Nenhuma rodada finalizada ainda</p>
              <p className="text-xs mt-1">O histórico aparece após os resultados serem publicados</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Rodadas',          value: history.length,   color: 'from-brand-500 to-brand-700',     val: 'text-brand-300' },
                { label: 'Pontos totais',     value: totalPoints,      color: 'from-amber-400 to-amber-600',     val: 'text-amber-300' },
                { label: 'Placares exatos',  value: totalExact,       color: 'from-emerald-500 to-emerald-700', val: 'text-emerald-300' },
                { label: 'Palpites feitos',  value: `${totalPreds}/${totalGames}`, color: 'from-cyan-500 to-cyan-700', val: 'text-cyan-300' },
              ].map(({ label, value, color, val }) => (
                <Card key={label} className="relative overflow-hidden">
                  <div className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${color}`} />
                  <CardContent className="pt-3 pb-3">
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className={`text-xl font-bold ${val}`}>{value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <RoundHistoryAccordion history={history} />
          </>
        )}
      </div>
    </div>
  );
}
