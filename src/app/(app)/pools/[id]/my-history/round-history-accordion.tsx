'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { RoundHistory } from '@/services/history.service';

const pointsStyle: Record<number, { bg: string; text: string; label: string }> = {
  10: { bg: 'bg-emerald-950/60 border-emerald-800', text: 'text-emerald-400', label: '10' },
  7:  { bg: 'bg-cyan-950/60 border-cyan-800',       text: 'text-cyan-400',    label: '7' },
  5:  { bg: 'bg-amber-950/60 border-amber-800',     text: 'text-amber-400',   label: '5' },
  3:  { bg: 'bg-purple-950/60 border-purple-800',   text: 'text-purple-400',  label: '3' },
  0:  { bg: 'bg-slate-800/40 border-slate-700',     text: 'text-slate-500',   label: '0' },
};

interface Props { history: RoundHistory[] }

export function RoundHistoryAccordion({ history }: Props) {
  const [open, setOpen] = useState<string | null>(history[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {history.map((round) => {
        const isOpen = open === round.id;
        return (
          <Card key={round.id} className="overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/30 transition-colors"
              onClick={() => setOpen(isOpen ? null : round.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium text-slate-200 truncate">{round.name}</span>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full border border-amber-800 bg-amber-950/40 text-amber-300 font-semibold">
                  {round.totalPoints} pts
                </span>
                {round.exactScores > 0 && (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full border border-emerald-800 bg-emerald-950/40 text-emerald-400">
                    {round.exactScores} exato{round.exactScores !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <ChevronDown
                size={16}
                className={`shrink-0 ml-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <CardContent className="px-5 pb-4 pt-0 space-y-2">
                {round.games.map((game) => {
                  const style = game.prediction ? (pointsStyle[game.prediction.points] ?? pointsStyle[0]) : null;
                  return (
                    <div
                      key={game.id}
                      className={`rounded-lg border px-4 py-3 ${style ? style.bg : 'bg-slate-800/20 border-slate-800'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Placar real */}
                        <div className="flex items-center gap-2 min-w-0">
                          {game.homeCrest && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={game.homeCrest} alt="" className="h-5 w-5 object-contain shrink-0" />
                          )}
                          <span className="text-sm text-slate-300 truncate">{game.homeTeam}</span>
                          <span className="shrink-0 font-bold text-slate-100 text-sm">
                            {game.homeScore} × {game.awayScore}
                          </span>
                          <span className="text-sm text-slate-300 truncate">{game.awayTeam}</span>
                          {game.awayCrest && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={game.awayCrest} alt="" className="h-5 w-5 object-contain shrink-0" />
                          )}
                        </div>

                        {/* Palpite + pontos */}
                        <div className="shrink-0 flex items-center gap-2">
                          {game.prediction ? (
                            <>
                              <span className="text-xs text-slate-500">
                                {game.prediction.homeScore}–{game.prediction.awayScore}
                              </span>
                              <span className={`text-xs font-bold ${style!.text}`}>
                                {style!.label} pts
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-600 italic">sem palpite</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
