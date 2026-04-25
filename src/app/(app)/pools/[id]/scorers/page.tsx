import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getPool, isParticipant } from '@/services/pool.service';
import { prisma } from '@/lib/prisma';
import { fetchScorers, type FDScorer } from '@/lib/football-data';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const metadata: Metadata = { title: 'Artilharia' };

interface Props { params: Promise<{ id: string }> }

function ScorerRow({ scorer, rank }: { scorer: FDScorer; rank: number }) {
  return (
    <tr className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30">
      {/* Rank */}
      <td className="py-2.5 pl-3 pr-2 text-center">
        <span className="text-xs font-semibold text-slate-400">{rank}</span>
      </td>

      {/* Player */}
      <td className="px-2 py-2.5">
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-slate-100 truncate leading-tight">{scorer.player.name}</span>
          <span className="text-xs text-slate-500 truncate">{scorer.player.nationality}</span>
        </div>
      </td>

      {/* Team */}
      <td className="px-2 py-2.5 hidden sm:table-cell">
        <div className="flex items-center gap-1.5 min-w-0">
          {scorer.team.crest ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scorer.team.crest} alt={scorer.team.shortName} className="h-4 w-4 object-contain shrink-0" />
          ) : (
            <div className="h-4 w-4 rounded-full bg-slate-700 shrink-0" />
          )}
          <span className="text-sm text-slate-300 truncate">{scorer.team.shortName || scorer.team.name}</span>
        </div>
      </td>

      {/* Goals */}
      <td className="px-2 py-2.5 text-center">
        <span className="font-bold text-amber-300">{scorer.goals}</span>
      </td>

      {/* Assists */}
      <td className="px-2 py-2.5 text-center text-slate-400 hidden md:table-cell">
        {scorer.assists ?? '—'}
      </td>

      {/* Penalties */}
      <td className="px-2 py-2.5 text-center text-slate-400 hidden md:table-cell">
        {scorer.penalties ?? '—'}
      </td>

      {/* Played */}
      <td className="px-2 py-2.5 text-center text-slate-500 hidden lg:table-cell">
        {scorer.playedMatches}
      </td>
    </tr>
  );
}

export default async function ScorersPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, member] = await Promise.all([
    getPool(id),
    isParticipant(session.user.id, id),
  ]);

  if (!pool || !pool.isActive) notFound();
  if (!member) redirect(`/pools/${id}`);

  const wcGame = await prisma.game.findFirst({
    where: { round: { poolId: id }, group: { not: null } },
    select: { id: true },
  });
  const competition: 'BSA' | 'WC' = wcGame ? 'WC' : 'BSA';

  let scorers: FDScorer[] = [];
  let fetchError = '';

  try {
    scorers = await fetchScorers(competition, 20);
  } catch {
    fetchError = 'Não foi possível carregar a artilharia. Verifique a chave da API ou tente novamente.';
  }

  return (
    <div>
      <Header
        title="Artilharia"
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
        {fetchError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle size={28} className="mx-auto mb-2 text-slate-600" />
              <p className="text-sm text-slate-500">{fetchError}</p>
            </CardContent>
          </Card>
        ) : scorers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500 text-sm">
              Artilharia ainda não disponível para esta competição
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500">
                    <th className="w-8 py-2.5 pl-3 pr-2 text-center font-medium">#</th>
                    <th className="px-2 py-2.5 text-left font-medium">Jogador</th>
                    <th className="px-2 py-2.5 text-left font-medium hidden sm:table-cell">Time</th>
                    <th className="w-10 px-2 py-2.5 text-center font-bold text-slate-300">Gols</th>
                    <th className="w-10 px-2 py-2.5 text-center font-medium hidden md:table-cell">Ass.</th>
                    <th className="w-10 px-2 py-2.5 text-center font-medium hidden md:table-cell">Pen.</th>
                    <th className="w-8 px-2 py-2.5 text-center font-medium hidden lg:table-cell">J</th>
                  </tr>
                </thead>
                <tbody>
                  {scorers.map((scorer, i) => (
                    <ScorerRow key={scorer.player.id} scorer={scorer} rank={i + 1} />
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-slate-600 text-center">
          Ass. = Assistências · Pen. = Pênaltis · J = Jogos disputados
        </p>
      </div>
    </div>
  );
}
