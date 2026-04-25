'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ArrowRight, Trophy, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoundStatusBadge } from '@/components/ui/badge';
import { formatDate, formatShortDateTime } from '@/lib/utils';

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string | null;
  awayCrest?: string | null;
  matchDate: string | Date;
  status: string;
}

interface Round {
  id: string;
  number: number;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  _count: { games: number };
}

interface FeaturedRound extends Round {
  games: Game[];
}

interface Props {
  poolId: string;
  featuredRound: FeaturedRound | null;
  featuredPredictions: Record<string, { homeScore: number; awayScore: number }>;
  otherOpenRounds: Round[];
  finishedRounds: Round[];
}

export function PoolRoundsSection({ poolId, featuredRound, featuredPredictions, otherOpenRounds, finishedRounds }: Props) {
  const [showFinished, setShowFinished] = useState(false);

  const hasAnyOpen = featuredRound || otherOpenRounds.length > 0;

  return (
    <Card>
      <CardHeader className="pt-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Rodadas</CardTitle>
          <Link href={`/pools/${poolId}/predictions`}>
            <Button variant="ghost" size="sm" className="text-xs">
              Fazer palpites <ArrowRight size={12} />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {!hasAnyOpen && finishedRounds.length === 0 && (
          <p className="text-sm text-slate-500 py-4 text-center">Nenhuma rodada cadastrada</p>
        )}

        {/* Featured open round */}
        {featuredRound && (
          <div className="rounded-xl border border-brand-800 bg-brand-950/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-900/60">
              <div>
                <div className="text-sm font-semibold text-slate-100">{featuredRound.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatDate(featuredRound.startDate)} — {formatDate(featuredRound.endDate)}
                </div>
              </div>
              <RoundStatusBadge status={featuredRound.status} />
            </div>

            {featuredRound.games.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-3">Nenhum jogo cadastrado</p>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {featuredRound.games.map((game) => {
                  const pred = featuredPredictions[game.id];
                  return (
                    <div key={game.id} className="px-3 py-2 space-y-1">
                      {/* Date — own line, no overflow risk */}
                      <div className="text-center text-xs text-slate-600">
                        {formatShortDateTime(game.matchDate)}
                      </div>

                      {/* Teams row — fixed-width center, names truncate freely */}
                      <div className="flex items-center gap-1">
                        {/* Home */}
                        <div className="flex-1 flex items-center justify-end gap-1 min-w-0">
                          <span className="text-xs font-medium text-slate-200 truncate">{game.homeTeam}</span>
                          {game.homeCrest && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={game.homeCrest} alt="" className="h-5 w-5 object-contain shrink-0" />
                          )}
                        </div>

                        {/* Prediction — fixed narrow column */}
                        <div className="shrink-0 w-14 text-center">
                          {pred ? (
                            <span className="text-xs font-bold text-brand-400">{pred.homeScore}×{pred.awayScore}</span>
                          ) : (
                            <span className="text-xs text-slate-700">–×–</span>
                          )}
                        </div>

                        {/* Away */}
                        <div className="flex-1 flex items-center justify-start gap-1 min-w-0">
                          {game.awayCrest && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={game.awayCrest} alt="" className="h-5 w-5 object-contain shrink-0" />
                          )}
                          <span className="text-xs font-medium text-slate-200 truncate">{game.awayTeam}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-4 py-3 border-t border-brand-900/60">
              <Link href={`/pools/${poolId}/predictions/${featuredRound.id}`}>
                <Button size="sm" className="w-full">
                  Fazer palpites <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Other open rounds */}
        {otherOpenRounds.map((round) => (
          <Link key={round.id} href={`/pools/${poolId}/predictions/${round.id}`}>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 hover:border-slate-700 transition-colors cursor-pointer">
              <div>
                <div className="text-sm font-medium text-slate-200">{round.name}</div>
                <div className="text-xs text-slate-500">
                  {formatDate(round.startDate)} — {formatDate(round.endDate)} · {round._count.games} jogo{round._count.games !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RoundStatusBadge status={round.status} />
                <ArrowRight size={14} className="text-slate-600" />
              </div>
            </div>
          </Link>
        ))}

        {/* Finished rounds accordion */}
        {finishedRounds.length > 0 && (
          <div>
            <button
              onClick={() => setShowFinished((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-400 hover:bg-slate-900 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Trophy size={12} />
                Finalizadas ({finishedRounds.length})
              </span>
              {showFinished ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>

            {showFinished && (
              <div className="mt-1.5 space-y-1.5">
                {finishedRounds.map((round) => (
                  <Link key={round.id} href={`/pools/${poolId}/predictions/${round.id}`}>
                    <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950/50 px-3 py-2.5 hover:border-slate-700 transition-colors cursor-pointer opacity-70 hover:opacity-100">
                      <div>
                        <div className="text-sm font-medium text-slate-300">{round.name}</div>
                        <div className="text-xs text-slate-600">
                          {formatDate(round.startDate)} — {formatDate(round.endDate)} · {round._count.games} jogo{round._count.games !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RoundStatusBadge status={round.status} />
                        <ArrowRight size={13} className="text-slate-700" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
