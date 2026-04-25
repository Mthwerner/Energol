import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getPool, isParticipant } from '@/services/pool.service';
import { prisma } from '@/lib/prisma';
import { fetchStandings, type FDStandingEntry, type FDStandingTable } from '@/lib/football-data';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const metadata: Metadata = { title: 'Tabela do Campeonato' };
export const revalidate = 1800;

interface Props { params: Promise<{ id: string }> }

function formatGroupLabel(group: string): string {
  const m = group.match(/GROUP_([A-Z]+)/);
  if (m) return `Grupo ${m[1]}`;
  return group.replace(/_/g, ' ');
}

// Zone highlight: returns left-border + bg class
function zoneClass(position: number, competition: 'BSA' | 'WC', isGroup: boolean): string {
  if (competition === 'BSA') {
    if (position <= 4)  return 'border-l-2 border-l-emerald-600 bg-emerald-950/10';
    if (position <= 6)  return 'border-l-2 border-l-cyan-700 bg-cyan-950/10';
    if (position >= 17) return 'border-l-2 border-l-red-800 bg-red-950/10';
  }
  if (competition === 'WC' && isGroup) {
    if (position <= 2)  return 'border-l-2 border-l-emerald-600 bg-emerald-950/10';
    if (position >= 3)  return 'border-l-2 border-l-slate-700 bg-transparent';
  }
  return 'border-l-2 border-l-transparent';
}

function StandingsTable({
  table,
  competition,
  isGroup = false,
}: {
  table: FDStandingEntry[];
  competition: 'BSA' | 'WC';
  isGroup?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              <th className="w-8 px-3 py-2.5 text-center font-medium">#</th>
              <th className="px-2 py-2.5 text-left font-medium">Time</th>
              {/* always visible */}
              <th className="w-10 px-2 py-2.5 text-center font-medium">Pts</th>
              {/* sm+ */}
              <th className="w-8 px-2 py-2.5 text-center font-medium hidden sm:table-cell">J</th>
              <th className="w-8 px-2 py-2.5 text-center font-medium hidden sm:table-cell">V</th>
              <th className="w-8 px-2 py-2.5 text-center font-medium hidden sm:table-cell">E</th>
              <th className="w-8 px-2 py-2.5 text-center font-medium hidden sm:table-cell">D</th>
              {/* md+ */}
              <th className="w-10 px-2 py-2.5 text-center font-medium hidden md:table-cell">GP</th>
              <th className="w-10 px-2 py-2.5 text-center font-medium hidden md:table-cell">GC</th>
              <th className="w-10 px-2 py-2.5 text-center font-medium hidden md:table-cell">SG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {table.map((entry) => {
              const zone = zoneClass(entry.position, competition, isGroup);
              return (
                <tr key={entry.team.id} className={`transition-colors hover:bg-slate-800/30 ${zone}`}>
                  {/* Position */}
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-xs font-semibold text-slate-400">{entry.position}</span>
                  </td>

                  {/* Team */}
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {entry.team.crest ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.team.crest}
                          alt={entry.team.shortName}
                          className="h-5 w-5 object-contain shrink-0"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-slate-700 shrink-0" />
                      )}
                      <span className="font-medium text-slate-100 truncate">
                        {entry.team.shortName || entry.team.name}
                      </span>
                    </div>
                  </td>

                  {/* Points — always visible, highlighted */}
                  <td className="px-2 py-2.5 text-center">
                    <span className="font-bold text-slate-100">{entry.points}</span>
                  </td>

                  {/* sm+ columns */}
                  <td className="px-2 py-2.5 text-center text-slate-400 hidden sm:table-cell">{entry.playedGames}</td>
                  <td className="px-2 py-2.5 text-center hidden sm:table-cell">
                    <span className={entry.won > 0 ? 'text-emerald-400 font-medium' : 'text-slate-500'}>{entry.won}</span>
                  </td>
                  <td className="px-2 py-2.5 text-center text-slate-400 hidden sm:table-cell">{entry.draw}</td>
                  <td className="px-2 py-2.5 text-center hidden sm:table-cell">
                    <span className={entry.lost > 0 ? 'text-red-400' : 'text-slate-500'}>{entry.lost}</span>
                  </td>

                  {/* md+ columns */}
                  <td className="px-2 py-2.5 text-center text-slate-400 hidden md:table-cell">{entry.goalsFor}</td>
                  <td className="px-2 py-2.5 text-center text-slate-400 hidden md:table-cell">{entry.goalsAgainst}</td>
                  <td className="px-2 py-2.5 text-center hidden md:table-cell">
                    <span className={
                      entry.goalDifference > 0 ? 'text-emerald-400' :
                      entry.goalDifference < 0 ? 'text-red-400' : 'text-slate-500'
                    }>
                      {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ZoneLegend({ competition }: { competition: 'BSA' | 'WC' }) {
  if (competition === 'BSA') {
    return (
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600 shrink-0" /> Libertadores (1–4)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-cyan-700 shrink-0" /> Sul-Americana (5–6)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-800 shrink-0" /> Rebaixamento (17–20)</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600 shrink-0" /> Avança (1–2)</span>
    </div>
  );
}

export default async function StandingsPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, member] = await Promise.all([
    getPool(id),
    isParticipant(session.user.id, id),
  ]);

  if (!pool || !pool.isActive) notFound();
  if (!member) redirect(`/pools/${id}`);

  // Detect competition: WC pools have games with groups, BSA pools don't
  const wcGame = await prisma.game.findFirst({
    where: { round: { poolId: id }, group: { not: null } },
    select: { id: true },
  });
  const competition: 'BSA' | 'WC' = wcGame ? 'WC' : 'BSA';

  let standings: FDStandingTable[] = [];
  let fetchError = '';

  try {
    const all = await fetchStandings(competition);
    standings = all.filter((s) => s.type === 'TOTAL');
  } catch {
    fetchError = 'Não foi possível carregar a tabela. Verifique a chave da API ou tente novamente.';
  }

  const isGrouped = standings.some((s) => s.group !== null);

  return (
    <div>
      <Header
        title="Tabela do Campeonato"
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
        ) : standings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500 text-sm">
              Tabela ainda não disponível para esta competição
            </CardContent>
          </Card>
        ) : (
          <>
            {isGrouped ? (
              // WC: one table per group
              standings.map((s) => (
                <div key={s.group} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {s.group ? formatGroupLabel(s.group) : 'Geral'}
                    </span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>
                  <StandingsTable table={s.table} competition={competition} isGroup />
                </div>
              ))
            ) : (
              // BSA: single table
              <StandingsTable table={standings[0].table} competition={competition} />
            )}

            <ZoneLegend competition={competition} />

            <p className="text-xs text-slate-600 text-center">
              J = Jogos · V = Vitórias · E = Empates · D = Derrotas · GP = Gols pró · GC = Gols contra · SG = Saldo
            </p>
          </>
        )}
      </div>
    </div>
  );
}
