import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPool, isParticipant } from '@/services/pool.service';
import { getPoolRanking } from '@/services/ranking.service';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Medal } from 'lucide-react';

export const metadata: Metadata = { title: 'Classificação' };

interface Props { params: Promise<{ id: string }> }

export default async function RankingPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, member, ranking] = await Promise.all([
    getPool(id),
    isParticipant(session.user.id, id),
    getPoolRanking(id),
  ]);

  if (!pool || !pool.isActive) notFound();
  if (!member) redirect(`/pools/${id}`);

  const medalColors = ['text-amber-400', 'text-slate-300', 'text-amber-700'];

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
                    {/* Tiers — visible progressively */}
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
                    const medal = entry.position <= 3 ? entry.position - 1 : -1;
                    return (
                      <TableRow key={entry.userId} className={isMe ? 'bg-brand-950/20' : ''}>
                        <TableCell className="font-medium">
                          {medal >= 0 ? (
                            <Medal size={16} className={medalColors[medal]} />
                          ) : (
                            <span className="text-slate-500">{entry.position}</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className={isMe ? 'font-semibold text-brand-300' : 'text-slate-200'}>
                            {entry.name}
                            {isMe && <span className="ml-1.5 text-xs text-slate-500">(você)</span>}
                          </span>
                          {/* Mobile: mini stats below name */}
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
