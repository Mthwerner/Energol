import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPool, isParticipant } from '@/services/pool.service';
import { getPoolStats } from '@/services/stats.service';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, TrendingUp, Flame, Shield, Trophy, Star } from 'lucide-react';

export const metadata: Metadata = { title: 'Estatísticas' };

interface Props { params: Promise<{ id: string }> }

export default async function StatsPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, member] = await Promise.all([getPool(id), isParticipant(session.user.id, id)]);

  if (!pool || !pool.isActive) notFound();
  if (!member) redirect(`/pools/${id}`);

  const stats = await getPoolStats(id);

  const { pointsDistribution: dist } = stats;
  const totalDist = dist.exact + dist.diffScore + dist.correct + dist.one + dist.wrong;

  const bars = [
    { label: '10 pts — Placar exato',       value: dist.exact,     color: 'bg-emerald-500', text: 'text-emerald-400' },
    { label: '7 pts — Result. + saldo',     value: dist.diffScore, color: 'bg-cyan-500',    text: 'text-cyan-400' },
    { label: '5 pts — Resultado certo',     value: dist.correct,   color: 'bg-amber-500',   text: 'text-amber-400' },
    { label: '3 pts — Um placar certo',     value: dist.one,       color: 'bg-purple-500',  text: 'text-purple-400' },
    { label: '0 pts — Errou',               value: dist.wrong,     color: 'bg-slate-600',   text: 'text-slate-500' },
  ];

  return (
    <div>
      <Header
        title="Estatísticas"
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

        {stats.totalGamesFinished === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-slate-500">
              <Star size={32} className="mx-auto mb-3 text-slate-700" />
              <p>Nenhum jogo finalizado ainda</p>
              <p className="text-xs mt-1">As estatísticas aparecem após os resultados dos jogos</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: <Target size={18} />, label: 'Jogos finalizados', value: stats.totalGamesFinished, color: 'from-brand-500 to-brand-700', val: 'text-brand-300' },
                { icon: <TrendingUp size={18} />, label: 'Palpites realizados', value: stats.totalPredictions, color: 'from-cyan-500 to-cyan-700', val: 'text-cyan-300' },
                { icon: <Star size={18} />, label: 'Aproveitamento geral', value: `${stats.overallCorrectPct}%`, color: 'from-amber-400 to-amber-600', val: 'text-amber-300' },
                { icon: <Trophy size={18} />, label: 'Melhor rodada', value: stats.bestRound ? `${stats.bestRound.points} pts` : '—', color: 'from-emerald-500 to-emerald-700', val: 'text-emerald-300' },
              ].map(({ icon, label, value, color, val }) => (
                <Card key={label} className="relative overflow-hidden">
                  <div className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${color}`} />
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-1 text-slate-500">{icon}<span className="text-xs">{label}</span></div>
                    <div className={`text-xl font-bold ${val}`}>{value}</div>
                    {label === 'Melhor rodada' && stats.bestRound && (
                      <div className="text-xs text-slate-600 mt-0.5 truncate">{stats.bestRound.participant} · {stats.bestRound.name}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Distribuição de pontuação */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-200">Distribuição de palpites</h3>
                  {totalDist === 0 ? (
                    <p className="text-sm text-slate-500">Sem dados</p>
                  ) : (
                    bars.map(({ label, value, color, text }) => {
                      const pct = totalDist > 0 ? (value / totalDist) * 100 : 0;
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">{label}</span>
                            <span className={`text-xs font-semibold ${text}`}>
                              {value} <span className="text-slate-600 font-normal">({pct.toFixed(0)}%)</span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${color} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Top acertadores de placar exato */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-200">Melhores em placar exato</h3>
                  {stats.topExact.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhum placar exato ainda</p>
                  ) : (
                    stats.topExact.map((entry, i) => {
                      const podium = ['text-amber-400', 'text-slate-300', 'text-amber-700'];
                      return (
                        <div key={entry.name} className="flex items-center gap-3">
                          <span className={`text-sm font-bold w-5 ${podium[i] ?? 'text-slate-500'}`}>{i + 1}</span>
                          <span className="flex-1 text-sm text-slate-200">{entry.name}</span>
                          <span className="text-sm font-semibold text-emerald-400">
                            {entry.count} <span className="text-xs text-slate-500 font-normal">exatos</span>
                          </span>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Jogo mais fácil / mais difícil */}
            {(stats.hardestGame || stats.easiestGame) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {stats.hardestGame && (
                  <Card className="border-red-900/40">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Flame size={15} className="text-red-400" />
                        <span className="text-sm font-semibold text-slate-200">Jogo mais difícil</span>
                      </div>
                      <p className="text-base font-semibold text-slate-100">
                        {stats.hardestGame.homeTeam} {stats.hardestGame.homeScore} × {stats.hardestGame.awayScore} {stats.hardestGame.awayTeam}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {Math.round(stats.hardestGame.correctPct * 100)}% de acerto
                        · {stats.hardestGame.total} palpites
                      </p>
                    </CardContent>
                  </Card>
                )}
                {stats.easiestGame && (
                  <Card className="border-emerald-900/40">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield size={15} className="text-emerald-400" />
                        <span className="text-sm font-semibold text-slate-200">Jogo mais fácil</span>
                      </div>
                      <p className="text-base font-semibold text-slate-100">
                        {stats.easiestGame.homeTeam} {stats.easiestGame.homeScore} × {stats.easiestGame.awayScore} {stats.easiestGame.awayTeam}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {Math.round(stats.easiestGame.correctPct * 100)}% de acerto
                        · {stats.easiestGame.total} palpites
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
