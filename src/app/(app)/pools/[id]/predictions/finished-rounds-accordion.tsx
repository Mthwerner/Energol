'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ArrowRight, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RoundStatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface Round {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  _count: { games: number };
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
            <Link key={round.id} href={`/pools/${poolId}/predictions/${round.id}`} className="block">
              <Card className="hover:border-slate-600 transition-colors cursor-pointer opacity-80 hover:opacity-100">
                <CardContent className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="font-medium text-slate-300 text-sm">{round.name}</div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {formatDate(round.startDate)} — {formatDate(round.endDate)} · {round._count.games} jogo{round._count.games !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoundStatusBadge status={round.status} />
                    <ArrowRight size={14} className="text-slate-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
