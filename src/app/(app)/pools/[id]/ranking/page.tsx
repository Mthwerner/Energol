import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPool, isParticipant } from '@/services/pool.service';
import { getPoolRanking, getPendingPredictionsAlert } from '@/services/ranking.service';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Medal, Bell, Clock } from 'lucide-react';
import { formatShortDateTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Classificação' };

interface Props { params: Promise<{ id: string }> }

export default async function RankingPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, member, ranking, pendingAlert] = await Promise.all([
    getPool(id),
    isParticipant(session.user.id, id),
    getPoolRanking(id),
    getPendingPredictionsAlert(id),
  ]);

  if (!pool || !pool.isActive) notFound();
  if (!member) redirect(`/pools/${id}`);

  const medalColors = ['text-amber-400', 'text-slate-300', 'text-amber-700'];

  // Calcula tempo restante legível
  function timeRemaining(endDate: Date): string {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return 'encerrado';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  }

  const isUrgent = pendingAlert
    ? new Date(pendingAlert.roundEndDate).getTime() - Date.now() < 12 * 3600000
    : false;

  return (
    <div>
      <Header
        title="Classificação"
        description={pool.name}
        actions={
          <Link href={`/pools/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} /> Voltar
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-6 space-y-4">

        {/* Pending predictions alert */}
        {pendingAlert && (
          <div className={`rounded-xl border p-4 ${
            isUrgent
              ? 'border-amber-700 bg-amber-950/40'
              : 'border-slate-700 bg-slate-900'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`shrink-0 mt-0.5 ${isUrgent ? 'text-amber-400' : 'text-slate-400'}`}>
                {isUrgent ? <Bell size={16} /> : <Clock size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-2">
                  <span className={`text-sm font-semibold ${isUrgent ? 'text-amber-300' : 'text-slate-200'}`}>
                    {pendingAlert.pending.length} participante{pendingAlert.pending.length !== 1 ? 's' : ''} sem palpite
                  </span>
                  <span className={`text-xs ${isUrgent ? 'text-amber-500' : 'text-slate-500'}`}>
                    · {pendingAlert.roundName}
                  </span>
                  <span className={`text-xs font-medium ${isUrgent ? 'text-amber-400' : 'text-slate-400'}`}>
                    · fecha em {timeRemaining(pendingAlert.roundEndDate)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pendingAlert.pending.map((p) => (
                    <span
                      key={p.userId}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        p.userId === session.user.id
                          ? isUrgent
                            ? 'bg-amber-900/60 border-amber-700 text-amber-200'
                            : 'bg-brand-900/60 border-brand-700 text-brand-200'
                          : isUrgent
                            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {p.name}{p.userId === session.user.id ? ' (você)' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA for the current user if they're in the pending list */}
            {pendingAlert.pending.some((p) => p.userId === session.user.id) && (
              <div className="mt-3 pl-7">
                <Link href={`/pools/${id}/predictions`}>
                  <Button size="sm" variant={isUrgent ? 'primary' : 'secondary'}>
                    Fazer meus palpites →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Ranking table */}
        <Card>
          <CardContent className="p-0">
            {ranking.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Medal size={32} className="mx-auto mb-3 text-slate-700" />
                <p>Nenhum ponto registrado ainda</p>
                <p className="text-xs mt-1">Os pontos aparecem após os resultados dos jogos</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead className="text-center hidden sm:table-cell w-14" title="Placar exato (10 pts)">
                      <span className="text-emerald-500">10</span>
                    </TableHead>
                    <TableHead className="text-center hidden md:table-cell w-14" title="Resultado + saldo (7 pts)">
                      <span className="text-cyan-500">7</span>
                    </TableHead>
                    <TableHead className="text-center hidden sm:table-cell w-14" title="Resultado certo (5 pts)">
                      <span className="text-amber-500">5</span>
                    </TableHead>
                    <TableHead className="text-center hidden md:table-cell w-14" title="Um placar certo (3 pts)">
                      <span className="text-purple-500">3</span>
                    </TableHead>
                    <TableHead className="text-center hidden lg:table-cell w-16">Rodadas</TableHead>
                    <TableHead className="text-right w-16">Pontos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((entry) => {
                    const isMe = entry.userId === session.user.id;
                    const isPending = pendingAlert?.pending.some((p) => p.userId === entry.userId);
                    const medal = entry.position <= 3 ? entry.position - 1 : -1;
                    return (
                      <TableRow
                        key={entry.userId}
                        className={isMe ? 'bg-brand-950/20' : ''}
                      >
                        <TableCell className="font-medium">
                          {medal >= 0 ? (
                            <Medal size={16} className={medalColors[medal]} />
                          ) : (
                            <span className="text-slate-500">{entry.position}</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={isMe ? 'font-semibold text-brand-300' : 'text-slate-200'}>
                              {entry.name}
                              {isMe && <span className="ml-1.5 text-xs text-slate-500">(você)</span>}
                            </span>
                            {isPending && (
                              <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full border ${
                                isUrgent
                                  ? 'text-amber-400 border-amber-800 bg-amber-950/40'
                                  : 'text-slate-500 border-slate-700 bg-slate-800'
                              }`}>
                                sem palpite
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 sm:hidden text-xs text-slate-500">
                            <span className="text-emerald-500">{entry.exactScores}×</span>
                            <span className="text-amber-500">{entry.correctResults}×</span>
                            <span className="text-purple-500">{entry.oneScores}×</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center hidden sm:table-cell">
                          <span className={entry.exactScores > 0 ? 'font-semibold text-emerald-400' : 'text-slate-600'}>
                            {entry.exactScores}
                          </span>
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          <span className={entry.resultDiffScores > 0 ? 'font-semibold text-cyan-400' : 'text-slate-600'}>
                            {entry.resultDiffScores}
                          </span>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <span className={entry.correctResults > 0 ? 'font-semibold text-amber-400' : 'text-slate-600'}>
                            {entry.correctResults}
                          </span>
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          <span className={entry.oneScores > 0 ? 'font-semibold text-purple-400' : 'text-slate-600'}>
                            {entry.oneScores}
                          </span>
                        </TableCell>
                        <TableCell className="text-center hidden lg:table-cell text-slate-400">
                          {entry.roundsPlayed}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-100 text-base">
                          {entry.totalPoints}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="font-bold text-emerald-500">10</span> Placar exato</span>
          <span className="flex items-center gap-1.5"><span className="font-bold text-cyan-500">7</span> Resultado + saldo</span>
          <span className="flex items-center gap-1.5"><span className="font-bold text-amber-500">5</span> Resultado certo</span>
          <span className="flex items-center gap-1.5"><span className="font-bold text-purple-500">3</span> Um placar certo</span>
        </div>

        <p className="text-xs text-slate-600">
          Desempate: placares exatos → resultados corretos → rodadas jogadas
        </p>
      </div>
    </div>
  );
}
