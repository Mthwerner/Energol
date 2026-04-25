'use client';

import { useState, useRef } from 'react';
import { Save, Check, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';

const CUTOFF_MS = 60 * 60 * 1000;

const isDeadlinePassed = (matchDate: string | Date) =>
  new Date(matchDate).getTime() - Date.now() < CUTOFF_MS;

function getDeadlineLabel(matchDate: string | Date): string {
  const diff = new Date(matchDate).getTime() - Date.now();
  if (diff <= 0) return 'Encerrado';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d restantes`;
  if (hours > 0) return `${hours}h ${minutes}min restantes`;
  return `${minutes}min restantes`;
}

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
  const [error, setError] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const openGames = games.filter((g) => !isDeadlinePassed(g.matchDate));
  const lockedGames = games.filter((g) => isDeadlinePassed(g.matchDate));

  const filled = openGames.filter((g) => {
    const p = predictions[g.id];
    return p && p.home !== '' && p.away !== '';
  }).length;

  const set = (gameId: string, field: 'home' | 'away', value: string) => {
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0)) return;
    setPredictions((prev) => ({
      ...prev,
      [gameId]: { ...(prev[gameId] ?? { home: '', away: '' }), [field]: value },
    }));
    // Auto-avança para o próximo campo ao preencher o placar do visitante
    if (field === 'away' && value !== '') {
      const currentIndex = openGames.findIndex((g) => g.id === gameId);
      const nextGame = openGames[currentIndex + 1];
      if (nextGame) {
        setTimeout(() => inputRefs.current[`${nextGame.id}-home`]?.focus(), 50);
      }
    }
  };

  const save = async () => {
    setError('');
    const preds = openGames
      .map((g) => {
        const p = predictions[g.id];
        if (!p || p.home === '' || p.away === '') return null;
        const home = parseInt(p.home);
        const away = parseInt(p.away);
        if (isNaN(home) || isNaN(away)) return null;
        return { gameId: g.id, homeScore: home, awayScore: away };
      })
      .filter(Boolean);

    if (preds.length === 0) {
      setError('Preencha ao menos um palpite antes de salvar');
      return;
    }

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
    } else {
      setError('Erro ao salvar. Tente novamente.');
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

  if (openGames.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Lock size={28} className="mx-auto mb-2 text-slate-700" />
          <p className="text-sm text-slate-500">Todos os jogos estão encerrados para palpites</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{filled} de {openGames.length} palpite{openGames.length !== 1 ? 's' : ''} preenchido{filled !== 1 ? 's' : ''}</span>
        <span className={filled === openGames.length ? 'text-emerald-400 font-medium' : ''}>
          {filled === openGames.length ? 'Todos preenchidos!' : `${openGames.length - filled} pendente${openGames.length - filled !== 1 ? 's' : ''}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: openGames.length > 0 ? `${(filled / openGames.length) * 100}%` : '0%' }}
        />
      </div>

      {/* Open games */}
      <Card>
        <CardContent className="divide-y divide-slate-800 p-0">
          {openGames.map((game, index) => {
            const p = predictions[game.id] ?? { home: '', away: '' };
            const isFilled = p.home !== '' && p.away !== '';
            const deadline = getDeadlineLabel(game.matchDate);
            const urgent = new Date(game.matchDate).getTime() - Date.now() < 3 * 3600000;

            return (
              <div
                key={game.id}
                className={`px-4 py-3.5 transition-colors ${isFilled ? 'bg-brand-950/20' : ''}`}
              >
                {/* Deadline */}
                <div className="flex justify-center mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${urgent ? 'text-amber-400 bg-amber-950/50 border border-amber-900' : 'text-slate-600'}`}>
                    {formatDateTime(game.matchDate)} · {deadline}
                  </span>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  {/* Home team */}
                  <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                    <div className="text-right min-w-0">
                      <div className="text-sm font-semibold text-slate-100 truncate">{game.homeTeam}</div>
                    </div>
                    {game.homeCrest ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={game.homeCrest} alt={game.homeTeam} className="h-9 w-9 object-contain shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-slate-800 shrink-0" />
                    )}
                  </div>

                  {/* Score inputs */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      ref={(el) => { inputRefs.current[`${game.id}-home`] = el; }}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={99}
                      value={p.home}
                      onChange={(e) => set(game.id, 'home', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="–"
                      className={`w-12 h-12 text-center text-lg font-bold rounded-lg border bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors
                        ${isFilled ? 'border-brand-700' : 'border-slate-700'}`}
                    />
                    <span className="text-slate-600 font-bold text-sm">×</span>
                    <input
                      ref={(el) => { inputRefs.current[`${game.id}-away`] = el; }}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={99}
                      value={p.away}
                      onChange={(e) => set(game.id, 'away', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="–"
                      className={`w-12 h-12 text-center text-lg font-bold rounded-lg border bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors
                        ${isFilled ? 'border-brand-700' : 'border-slate-700'}`}
                    />
                  </div>

                  {/* Away team */}
                  <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
                    {game.awayCrest ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={game.awayCrest} alt={game.awayTeam} className="h-9 w-9 object-contain shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-slate-800 shrink-0" />
                    )}
                    <div className="text-sm font-semibold text-slate-100 truncate">{game.awayTeam}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Locked games (collapsed info) */}
      {lockedGames.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-xs text-slate-600">
          <Lock size={12} />
          {lockedGames.length} jogo{lockedGames.length !== 1 ? 's' : ''} já encerrado{lockedGames.length !== 1 ? 's' : ''} para palpites
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-900 bg-red-950/50 px-4 py-2.5 text-sm text-red-400">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Save button — sticky on mobile */}
      <div className="sticky bottom-20 md:bottom-4 z-10">
        <Button
          onClick={save}
          loading={saving}
          className="w-full shadow-lg shadow-black/40"
          size="lg"
        >
          {saved
            ? <><Check size={16} /> Palpites salvos!</>
            : <><Save size={16} /> Salvar palpites {filled > 0 ? `(${filled})` : ''}</>
          }
        </Button>
      </div>
    </div>
  );
}
