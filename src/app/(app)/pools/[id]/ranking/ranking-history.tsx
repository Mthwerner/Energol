'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { RankingHistory } from '@/services/ranking.service';

function cellColor(pts: number | null): string {
  if (pts === null) return 'text-slate-700';
  if (pts >= 20) return 'font-semibold text-emerald-400';
  if (pts >= 10) return 'text-amber-400';
  if (pts > 0)   return 'text-slate-400';
  return 'text-slate-600';
}

interface Props {
  history: RankingHistory;
  currentUserId: string;
}

export function RankingHistoryTable({ history, currentUserId }: Props) {
  const [open, setOpen] = useState(false);

  const { rounds, participants } = history;

  return (
    <Card>
      <button
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-800/20 transition-colors rounded-xl"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <TrendingUp size={14} className="text-slate-400" />
          Evolução por rodada
        </span>
        {open
          ? <ChevronUp size={14} className="text-slate-500 shrink-0" />
          : <ChevronDown size={14} className="text-slate-500 shrink-0" />
        }
      </button>

      {open && (
        <CardContent className="p-0 border-t border-slate-800 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="sticky left-0 z-10 bg-slate-900 px-4 py-2.5 text-left font-medium min-w-[130px]">
                  Participante
                </th>
                {rounds.map((r) => (
                  <th
                    key={r.id}
                    title={r.name}
                    className="px-3 py-2.5 text-center font-medium min-w-[46px] whitespace-nowrap"
                  >
                    R{r.number}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-center font-bold text-slate-300 min-w-[52px]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {participants.map((p) => {
                const total = p.roundPoints.reduce((s: number, v) => s + (v ?? 0), 0);
                const isMe = p.userId === currentUserId;
                return (
                  <tr
                    key={p.userId}
                    className={`transition-colors hover:bg-slate-800/30 ${isMe ? 'bg-brand-950/20' : ''}`}
                  >
                    <td
                      className={`sticky left-0 z-10 px-4 py-2.5 font-medium truncate max-w-[160px] ${
                        isMe ? 'bg-brand-950/40 text-brand-300' : 'bg-slate-900 text-slate-200'
                      }`}
                    >
                      {p.name}
                    </td>
                    {p.roundPoints.map((pts, i) => (
                      <td key={i} className={`px-3 py-2.5 text-center ${cellColor(pts)}`}>
                        {pts !== null ? pts : '—'}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center font-bold text-slate-100">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-slate-600">
            R1, R2... = número da rodada · toque ou passe o cursor para ver o nome completo.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
