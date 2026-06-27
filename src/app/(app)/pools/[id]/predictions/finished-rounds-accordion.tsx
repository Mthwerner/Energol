'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Trophy, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RoundStatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const pointsColor: Record<number, string> = {
  10: 'text-emerald-400',
  7:  'text-cyan-400',
  5:  'text-amber-400',
  3:  'text-purple-400',
  0:  'text-red-400',
};

interface Round {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  _count: { games: number };
}

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest: string | null;
  awayCrest: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

interface PredEntry {
  homeScore: number;
  awayScore: number;
  points: number | null;
}

interface RoundRowProps {
  poolId: string;
  round: Round;
}

function RoundRow({ poolId, round }: RoundRowProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[] | null>(null);
  const [predMap, setPredMap] = useState<Map<string, PredEntry> | null>(null);

  const handleToggle = async () => {
    if (!open && games === null) {
      setLoading(true);
      const [roundRes, predsRes] = await Promise.all([
        fetch(`/api/pools/${poolId}/rounds/${round.id}`),
        fetch(`/api/pools/${poolId}/predictions`),
      ]);
      const roundData = await roundRes.json();
      const predsData: { gameId: string; homeScore: number; awayScore: number; points: number | null }[] = await predsRes.json();

      setGames(roundData.games ?? []);

      const map = new Map<string, PredEntry>();
      for (const p of predsData) {
        map.set(p.gameId, { homeScore: p.homeScore, awayScore: p.awayScore, points: p.points });
      }
      setPredMap(map);
      setLoading(false);
    }
    setOpen((v) => !v);
  };

  return (
    <Card className={`transition-colors ${open ? 'border-slate-700' : 'opacity-80 hover:opacity-100'}`}>
      {/* Round header — toggles expand */}
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <div>
          <div className="font-medium text-slate-300 text-sm">{round.name}</div>
          <div className="text-xs text-slate-600 mt-0.5">
            {formatDate(round.startDate)} — {formatDate(round.endDate)} · {round._count.games} jogo{round._count.games !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RoundStatusBadge status={round.status} />
          {loading
            ? <Loader2 size={14} className="text-slate-500 animate-spin" />
            : open
              ? <ChevronDown size={14} className="text-slate-500" />
              : <ChevronRight size={14} className="text-slate-500" />
          }
        </div>
      </button>

      {/* Expanded: user predictions read-only */}
      {open && games !== null && predMap !== null && (
        <div className="border-t border-slate-800">
          <div className="divide-y divide-slate-800/60">
            {games.map((game) => {
              const pred = predMap.get(game.id);
              const pts = pred?.points;
              const color = pts !== null && pts !== undefined ? (pointsColor[pts] ?? 'text-slate-400') : 'text-slate-600';
              const hasResult = game.status === 'FINISHED' && game.homeScore !== null;

              return (
                <div key={game.id} className="flex items-center gap-3 px-5 py-2.5">
                  {/* Home */}
                  <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                    {game.homeCrest && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={game.homeCrest} alt={game.homeTeam} className="h-5 w-5 object-contain shrink-0" />
                    )}
                    <span className="text-xs text-slate-300 truncate">{game.homeTeam}</span>
                  </div>

                  {/* Scores */}
                  <div className="flex flex-col items-center gap-1 shrink-0 w-24">
                    {hasResult && (
                      <div className="flex items-center gap-0.5 text-xs text-slate-500">
                        <span className="w-5 text-center font-semibold text-slate-300">{game.homeScore}</span>
                        <span>x</span>
                        <span className="w-5 text-center font-semibold text-slate-300">{game.awayScore}</span>
                      </div>
                    )}
                    {pred ? (
                      <div className={`flex items-center gap-0.5 text-xs ${color}`}>
                        <span className="w-5 text-center font-medium border border-current/30 rounded">{pred.homeScore}</span>
                        <span className="text-slate-600">x</span>
                        <span className="w-5 text-center font-medium border border-current/30 rounded">{pred.awayScore}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-700 italic">sem palpite</span>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-xs text-slate-300 truncate">{game.awayTeam}</span>
                    {game.awayCrest && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={game.awayCrest} alt={game.awayTeam} className="h-5 w-5 object-contain shrink-0" />
                    )}
                  </div>

                  {/* Points */}
                  <div className="shrink-0 w-10 text-right">
                    {pts !== null && pts !== undefined && (
                      <span className={`text-xs font-bold ${color}`}>+{pts}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Link to full round page */}
          <div className="px-5 py-3 border-t border-slate-800/60">
            <Link
              href={`/pools/${poolId}/predictions/${round.id}`}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ExternalLink size={11} />
              Ver palpites de todos os participantes
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}

interface Props {
  poolId: string;
  rounds: Round[];
}

export function FinishedRoundsAccordion({ poolId, rounds }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section className="space-y-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-400 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Trophy size={13} />
          Rodadas finalizadas ({rounds.length})
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div className="space-y-2">
          {rounds.map((round) => (
            <RoundRow key={round.id} poolId={poolId} round={round} />
          ))}
        </div>
      )}
    </section>
  );
}
