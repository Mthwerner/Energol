'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ParticipantRoundData } from '@/services/prediction.service';

const pointsColor: Record<number, string> = {
  10: 'text-emerald-400',
  7:  'text-cyan-400',
  5:  'text-amber-400',
  3:  'text-purple-400',
  0:  'text-red-400',
};

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string | null;
  awayCrest?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

interface Props {
  participants: ParticipantRoundData[];
  games: Game[];
  currentUserId: string;
}

function ParticipantRow({
  participant,
  games,
  isCurrentUser,
}: {
  participant: ParticipantRoundData;
  games: Game[];
  isCurrentUser: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-800 last:border-0">
      <button
        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-800/40 ${isCurrentUser ? 'bg-brand-950/20' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown size={14} className="text-slate-500 shrink-0" /> : <ChevronRight size={14} className="text-slate-500 shrink-0" />}
          <span className={`text-sm font-medium truncate ${isCurrentUser ? 'text-brand-300' : 'text-slate-200'}`}>
            {participant.name}
            {isCurrentUser && <span className="ml-1.5 text-xs text-brand-500">(você)</span>}
          </span>
        </div>
        <span className="text-sm font-bold text-slate-100 shrink-0 ml-3">
          {participant.totalPoints} pts
        </span>
      </button>

      {open && (
        <div className="bg-slate-900/50 divide-y divide-slate-800/60">
          {games.map((game) => {
            const pred = participant.predictions[game.id];
            const pts = pred?.points;
            const color = pts !== null && pts !== undefined ? (pointsColor[pts] ?? 'text-slate-400') : 'text-slate-600';
            const finished = game.status === 'FINISHED' && game.homeScore !== null;

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
                <div className="flex flex-col items-center gap-1 shrink-0 w-20">
                  {finished && (
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
                    <span className="text-xs text-slate-600 italic">—</span>
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
      )}
    </div>
  );
}

export function ParticipantsPredictions({ participants, games, currentUserId }: Props) {
  if (participants.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pt-5 pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users size={14} className="text-slate-400" />
          Palpites dos participantes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div>
          {participants.map((p) => (
            <ParticipantRow
              key={p.userId}
              participant={p}
              games={games}
              isCurrentUser={p.userId === currentUserId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
