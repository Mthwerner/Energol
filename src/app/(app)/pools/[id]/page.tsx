import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getPool, isParticipant, isOwner } from '@/services/pool.service';
import { listRounds, getRound } from '@/services/round.service';
import { getPoolRanking } from '@/services/ranking.service';
import { getUserPredictionsForRound } from '@/services/prediction.service';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { InviteButton } from './invite-button';
import { OwnerActionsMenu } from './owner-menu';
import { PoolRoundsSection } from './pool-rounds-section';
import { OnboardingBanner } from './onboarding-banner';
import { Users, Trophy, Target, Settings, ArrowRight, UserMinus, BookOpen, BarChart2, Swords, PieChart, History } from 'lucide-react';

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

  const now = new Date();
  const openRounds = rounds.filter((r) => (r.status === 'OPEN' || r.status === 'IN_PROGRESS') && new Date(r.endDate) > now);
  const finishedRounds = rounds.filter((r) => r.status === 'FINISHED');

  // Rodada em destaque: a que encerra mais cedo (mais urgente)
  const featuredRoundBase = openRounds.length > 0
    ? openRounds.reduce((a, b) => new Date(a.endDate) <= new Date(b.endDate) ? a : b)
    : null;

  const [featuredRound, featuredPredictions] = featuredRoundBase
    ? await Promise.all([
        getRound(featuredRoundBase.id),
        getUserPredictionsForRound(session.user.id, featuredRoundBase.id),
      ])
    : [null, []];

  const predMap: Record<string, { homeScore: number; awayScore: number }> = {};
  for (const p of featuredPredictions) {
    predMap[p.gameId] = { homeScore: p.homeScore, awayScore: p.awayScore };
  }

  const otherOpenRounds = openRounds.filter((r) => r.id !== featuredRoundBase?.id);

  const myRank = ranking.find((r) => r.userId === session.user.id);
  const hasPredictions = featuredPredictions.length > 0 || finishedRounds.length > 0;

  return (
    <div>
      <Header
        title={pool.name}
        description={pool.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {/* Navegação: visível só no desktop */}
            <div className="hidden md:flex items-center gap-2">
              <Link href={`/pools/${id}/standings`}>
                <Button variant="ghost" size="sm">
                  <BarChart2 size={14} /> Tabela
                </Button>
              </Link>
              <Link href={`/pools/${id}/scorers`}>
                <Button variant="ghost" size="sm">
                  <Swords size={14} /> Artilharia
                </Button>
              </Link>
              <Link href={`/pools/${id}/stats`}>
                <Button variant="ghost" size="sm">
                  <PieChart size={14} /> Estatísticas
                </Button>
              </Link>
              <Link href={`/pools/${id}/rules`}>
                <Button variant="ghost" size="sm">
                  <BookOpen size={14} /> Regras
                </Button>
              </Link>
            </div>
            {/* Convidar: visível para o dono */}
            {owner && <InviteButton poolId={id} />}
            {/* ⋮ no mobile (todos) / botões completos no desktop (só dono) */}
            <OwnerActionsMenu poolId={id} poolName={pool.name} isOwner={owner} />
          </div>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <OnboardingBanner poolId={id} hasPredictions={hasPredictions} />

        {/* My stats */}
        {myRank && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Posição',        value: `#${myRank.position}`,    bar: 'from-brand-500 to-brand-700',   valCls: 'text-brand-300' },
              { label: 'Pontos',         value: myRank.totalPoints,        bar: 'from-amber-400 to-amber-600',   valCls: 'text-amber-300' },
              { label: 'Placar exato',   value: myRank.exactScores,        bar: 'from-emerald-500 to-emerald-700', valCls: 'text-emerald-300' },
              { label: 'Resultado certo',value: myRank.correctResults,     bar: 'from-cyan-500 to-cyan-700',     valCls: 'text-cyan-300' },
            ].map(({ label, value, bar, valCls }) => (
              <Card key={label} className="relative overflow-hidden">
                <div className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${bar}`} />
                <CardContent className="pt-4 pb-4">
                  <div className="text-xs text-slate-500 mb-1">{label}</div>
                  <div className={`text-xl font-bold ${valCls}`}>{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Rounds */}
          <PoolRoundsSection
            poolId={id}
            featuredRound={featuredRound}
            featuredPredictions={predMap}
            otherOpenRounds={otherOpenRounds}
            finishedRounds={finishedRounds}
          />

          {/* Ranking preview */}
          <Card>
            <CardHeader className="pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Classificação</CardTitle>
                <div className="flex items-center gap-1">
                  <Link href={`/pools/${id}/my-history`}>
                    <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                      <History size={12} /> Histórico
                    </Button>
                  </Link>
                  <Link href={`/pools/${id}/ranking`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Ver completa <ArrowRight size={12} />
                    </Button>
                  </Link>
                </div>
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
                    {ranking.map((entry) => (
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
