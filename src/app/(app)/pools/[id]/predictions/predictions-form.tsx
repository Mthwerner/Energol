'use client';

import { useState } from 'react';
import { Save, Check, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';

const CUTOFF_MS = 60 * 60 * 1000;
const isDeadlinePassed = (matchDate: string | Date) =>
  new Date(matchDate).getTime() - Date.now() < CUTOFF_MS;

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string | null;
  awayCrest?: string | null;
  matchDate: string | Date;
  status: string;
}

interface Props {
  poolId: string;
  games: Game[];
  initialPredictions: Record<string, { homeScore: number; awayScore: number }>;
}

export function PredictionsForm({ poolId, games, initialPredictions }: Props) {
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>(() => {
    const init: Record<string, { home: string; away: string }> = {};
    for (const [gameId, p] of Object.entries(initialPredictions)) {
      init[gameId] = { home: String(p.homeScore), away: String(p.awayScore) };
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (gameId: string, field: 'home' | 'away', value: string) => {
    setPredictions((prev) => ({
      ...prev,
      [gameId]: { ...prev[gameId], [field]: value },
    }));
  };

  const save = async () => {
    const preds = games
      .map((g) => {
        if (isDeadlinePassed(g.matchDate)) return null;
        const p = predictions[g.id];
        if (!p) return null;
        const home = parseInt(p.home);
        const away = parseInt(p.away);
        if (isNaN(home) || isNaN(away)) return null;
        return { gameId: g.id, homeScore: home, awayScore: away };
      })
      .filter(Boolean);

    if (preds.length === 0) return;

    setSaving(true);
    const res = await fetch(`/api/pools/${poolId}/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predictions: preds }),
    });
    setSaving(false);

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          Nenhum jogo nesta rodada
        </CardContent>
      </Card>
    );
  }

  const anyOpen = games.some((g) => !isDeadlinePassed(g.matchDate));

  return (
    <div className="space-y-4">
      {anyOpen && (
        <div className="flex justify-end">
          <Button size="sm" onClick={save} loading={saving}>
            {saved ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar palpites</>}
          </Button>
        </div>
      )}
      <Card>
        <CardContent className="divide-y divide-slate-800 p-0">
          {games.map((game) => {
            const locked = isDeadlinePassed(game.matchDate);
            const p = predictions[game.id] ?? { home: '', away: '' };
            return (
              <div key={game.id} className={`flex items-center gap-3 px-4 py-3 ${locked ? 'opacity-60' : ''}`}>
                {/* Home */}
                <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                  <div className="text-right min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{game.homeTeam}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(game.matchDate)}</div>
                  </div>
                  {game.homeCrest && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.homeCrest} alt={game.homeTeam} className="h-8 w-8 object-contain shrink-0" />
                  )}
                </div>

                {/* Score inputs */}
                {locked ? (
                  <div className="flex items-center gap-1.5 shrink-0 text-slate-600">
                    <Lock size={14} />
                    <span className="text-xs">Encerrado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      value={p.home}
                      onChange={(e) => set(game.id, 'home', e.target.value)}
                      placeholder="0"
                      className="w-12 h-10 text-center font-bold rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-slate-600 font-bold text-xs">x</span>
                    <input
                      type="number"
                      min={0}
                      value={p.away}
                      onChange={(e) => set(game.id, 'away', e.target.value)}
                      placeholder="0"
                      className="w-12 h-10 text-center font-bold rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                )}

                {/* Away */}
                <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
                  {game.awayCrest && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.awayCrest} alt={game.awayTeam} className="h-8 w-8 object-contain shrink-0" />
                  )}
                  <div className="text-sm font-medium text-slate-200 truncate">{game.awayTeam}</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
