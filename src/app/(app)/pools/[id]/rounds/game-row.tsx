'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { GameStatusBadge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string | null;
  awayCrest?: string | null;
  matchDate: string | Date;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

interface Props {
  game: Game;
  poolId: string;
  roundId: string;
  onResultSet: (homeScore: number, awayScore: number) => void;
}

export function GameRow({ game, onResultSet }: Props) {
  const [open, setOpen] = useState(false);
  const [home, setHome] = useState(String(game.homeScore ?? ''));
  const [away, setAway] = useState(String(game.awayScore ?? ''));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const hs = parseInt(home);
    const as = parseInt(away);
    if (isNaN(hs) || isNaN(as)) return;

    setSaving(true);
    const res = await fetch(`/api/games/${game.id}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeScore: hs, awayScore: as }),
    });
    setSaving(false);

    if (res.ok) {
      onResultSet(hs, as);
      setOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm min-w-0">
            {game.homeCrest && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={game.homeCrest} alt={game.homeTeam} className="h-6 w-6 object-contain shrink-0" />
            )}
            <span className="text-slate-200 font-medium truncate">{game.homeTeam}</span>
            {game.status === 'FINISHED' ? (
              <span className="font-bold text-slate-100 mx-1 shrink-0">{game.homeScore} x {game.awayScore}</span>
            ) : (
              <span className="text-slate-600 mx-1 shrink-0 text-xs">{formatDateTime(game.matchDate)}</span>
            )}
            <span className="text-slate-200 font-medium truncate">{game.awayTeam}</span>
            {game.awayCrest && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={game.awayCrest} alt={game.awayTeam} className="h-6 w-6 object-contain shrink-0" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <GameStatusBadge status={game.status} />
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)} className="h-7 px-2">
            <CheckCircle2 size={14} />
          </Button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar resultado">
        <div className="space-y-4">
          <div className="flex items-center gap-4 justify-center">
            {/* Home */}
            <div className="text-center flex-1">
              {game.homeCrest && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={game.homeCrest} alt={game.homeTeam} className="h-10 w-10 object-contain mx-auto mb-1" />
              )}
              <div className="text-xs text-slate-400 mb-2 font-medium">{game.homeTeam}</div>
              <input
                type="number"
                min={0}
                value={home}
                onChange={(e) => setHome(e.target.value)}
                className="w-16 h-12 text-center text-lg font-bold rounded-lg border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <span className="text-slate-500 font-bold text-xl">×</span>

            {/* Away */}
            <div className="text-center flex-1">
              {game.awayCrest && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={game.awayCrest} alt={game.awayTeam} className="h-10 w-10 object-contain mx-auto mb-1" />
              )}
              <div className="text-xs text-slate-400 mb-2 font-medium">{game.awayTeam}</div>
              <input
                type="number"
                min={0}
                value={away}
                onChange={(e) => setAway(e.target.value)}
                className="w-16 h-12 text-center text-lg font-bold rounded-lg border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} loading={saving} className="flex-1">Salvar resultado</Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
