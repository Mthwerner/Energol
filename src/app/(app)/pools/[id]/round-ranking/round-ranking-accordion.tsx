'use client';

import { useState } from 'react';
import { ChevronDown, Medal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';

interface Participant {
  position: number;
  userId: string;
  name: string;
  avatar: string | null;
  totalPoints: number;
  exactScores: number;
}

interface RoundData {
  id: string;
  name: string;
  participants: Participant[];
}

interface Props {
  rounds: RoundData[];
  currentUserId: string;
}

const medalColors = ['text-amber-400', 'text-slate-300', 'text-amber-700'];

export function RoundRankingAccordion({ rounds, currentUserId }: Props) {
  const [open, setOpen] = useState<string | null>(rounds[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {rounds.map((round) => {
        const isOpen = open === round.id;
        const winner = round.participants[0];

        return (
          <Card key={round.id} className="overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/30 transition-colors"
              onClick={() => setOpen(isOpen ? null : round.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium text-slate-200 truncate">{round.name}</span>
                {winner && (
                  <div className="shrink-0 flex items-center gap-1.5">
                    <UserAvatar avatar={winner.avatar} name={winner.name} size="xs" />
                    <span className="text-xs text-amber-400 font-semibold hidden sm:block truncate max-w-[120px]">
                      {winner.name}
                    </span>
                    <span className="text-xs text-amber-500 font-bold">{winner.totalPoints} pts</span>
                  </div>
                )}
              </div>
              <ChevronDown
                size={16}
                className={`shrink-0 ml-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <CardContent className="px-0 pb-3 pt-0">
                {round.participants.length === 0 ? (
                  <p className="text-sm text-slate-500 px-5">Sem pontuações nesta rodada</p>
                ) : (
                  round.participants.map((p) => {
                    const isMe = p.userId === currentUserId;
                    const medal = p.position <= 3 ? p.position - 1 : -1;
                    return (
                      <div
                        key={p.userId}
                        className={`flex items-center gap-3 px-5 py-2.5 ${isMe ? 'bg-brand-950/20' : ''}`}
                      >
                        {/* Position */}
                        <div className="w-6 shrink-0 flex items-center justify-center">
                          {medal >= 0 ? (
                            <Medal size={16} className={medalColors[medal]} />
                          ) : (
                            <span className="text-sm text-slate-500">{p.position}</span>
                          )}
                        </div>

                        {/* Avatar + name */}
                        <UserAvatar avatar={p.avatar} name={p.name} size="xs" />
                        <span className={`flex-1 text-sm truncate ${isMe ? 'font-semibold text-brand-300' : 'text-slate-200'}`}>
                          {p.name}{isMe && <span className="text-slate-500 font-normal ml-1">(você)</span>}
                        </span>

                        {/* Exact scores */}
                        {p.exactScores > 0 && (
                          <span className="text-xs text-emerald-400 shrink-0">
                            {p.exactScores}✓
                          </span>
                        )}

                        {/* Points */}
                        <span className={`text-sm font-bold shrink-0 ${p.position === 1 ? 'text-amber-400' : 'text-slate-300'}`}>
                          {p.totalPoints}
                        </span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
