import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getPool, isParticipant, isOwner } from '@/services/pool.service';
import { listRounds } from '@/services/round.service';
import { getPoolRanking } from '@/services/ranking.service';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoundStatusBadge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { InviteButton } from './invite-button';
import { Users, Trophy, Target, Settings, ArrowRight, UserMinus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const pool = await getPool(id);
  return { title: pool?.name ?? 'Bolão' };
}

interface Props { params: Promise<{ id: string }> }

export default async function PoolPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, member, owner, rounds, ranking] = await Promise.all([
    getPool(id),
    isParticipant(session.user.id, id),
    isOwner(session.user.id, id),
    listRounds(id),
    getPoolRanking(id),
  ]);

  if (!pool || !pool.isActive) notFound();
  if (!member) redirect('/pools');

  const myRank = ranking.find((r) => r.userId === session.user.id);

  return (
    <div>
      <Header
        title={pool.name}
        description={pool.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {owner && <InviteButton poolId={id} />}
            {owner && (
              <Link href={`/pools/${id}/participants`}>
                <Button variant="secondary" size="sm">
                  <UserMinus size={14} /> Participantes
                </Button>
              </Link>
            )}
            {owner && (
              <Link href={`/pools/${id}/rounds`}>
                <Button variant="secondary" size="sm">
                  <Settings size={14} /> Gerenciar
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* My stats */}
        {myRank && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Posição', value: `#${myRank.position}` },
              { label: 'Pontos', value: myRank.totalPoints },
              { label: 'Placar exato', value: myRank.exactScores },
              { label: 'Resultado certo', value: myRank.correctResults },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-4">
                  <div className="text-xs text-slate-500 mb-1">{label}</div>
                  <div className="text-xl font-bold text-slate-100">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Rounds */}
          <Card>
            <CardHeader className="pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Rodadas</CardTitle>
                <Link href={`/pools/${id}/predictions`}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Fazer palpites <ArrowRight size={12} />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {rounds.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">Nenhuma rodada cadastrada</p>
              ) : (
                <div className="space-y-2">
                  {rounds.map((round) => (
                    <div key={round.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5">
                      <div>
                        <div className="text-sm font-medium text-slate-200">{round.name}</div>
                        <div className="text-xs text-slate-500">
                          {formatDate(round.startDate)} — {formatDate(round.endDate)} · {round._count.games} jogo{round._count.games !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <RoundStatusBadge status={round.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ranking preview */}
          <Card>
            <CardHeader className="pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Classificação</CardTitle>
                <Link href={`/pools/${id}/ranking`}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Ver completa <ArrowRight size={12} />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {ranking.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center px-5">Nenhum ponto registrado ainda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Participante</TableHead>
                      <TableHead className="text-right">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.slice(0, 5).map((entry) => (
                      <TableRow key={entry.userId} className={entry.userId === session.user.id ? 'bg-brand-950/30' : ''}>
                        <TableCell className="font-medium text-slate-400">{entry.position}</TableCell>
                        <TableCell className={entry.userId === session.user.id ? 'text-brand-300 font-medium' : ''}>{entry.name}</TableCell>
                        <TableCell className="text-right font-semibold">{entry.totalPoints}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
