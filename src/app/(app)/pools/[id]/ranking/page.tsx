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

  const medalColors = ['text-amber-400', 'text-slate-400', 'text-amber-700'];

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

      <div className="p-6">
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
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Exatos</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Resultados</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Rodadas</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((entry) => {
                    const isMe = entry.userId === session.user.id;
                    const medal = entry.position <= 3 ? entry.position - 1 : -1;
                    return (
                      <TableRow key={entry.userId} className={isMe ? 'bg-brand-950/20' : ''}>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell text-slate-400">
                          {entry.exactScores}
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell text-slate-400">
                          {entry.correctResults}
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell text-slate-400">
                          {entry.roundsPlayed}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-100">
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

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>Desempate: 1° Placares exatos · 2° Resultados corretos · 3° Rodadas jogadas</span>
        </div>
      </div>
    </div>
  );
}
