'use client';

import { useState, useRef } from 'react';
import { Save, Check, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { findOdds, type OddsEvent } from '@/lib/odds';

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

function formatGroupLabel(group: string): string {
  const m = group.match(/GROUP_([A-Z]+)/);
  if (m) return `Grupo ${m[1]}`;
  return group.replace(/_/g, ' ');
}

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string | null;
  awayCrest?: string | null;
  matchDate: string | Date;
  status: string;
  group?: string | null;
}

interface Props {
  poolId: string;
  games: Game[];
  initialPredictions: Record<string, { homeScore: number; awayScore: number }>;
  oddsEvents?: OddsEvent[];
}

export function PredictionsForm({ poolId, games, initialPredictions, oddsEvents = [] }: Props) {
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

  // ── Grouping logic ────────────────────────────────────────────────────────
  const hasGroups = openGames.some((g) => g.group);

  // Build ordered group sections: map of groupKey → games[]
  const groupSections: { key: string; label: string | null; games: Game[] }[] = [];

  if (hasGroups) {
    const groupMap = new Map<string, Game[]>();
    for (const game of openGames) {
      const key = game.group ?? '__ungrouped__';
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(game);
    }
    // Sort groups alphabetically (GROUP_A before GROUP_B, etc.)
    const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => {
      if (a === '__ungrouped__') return 1;
      if (b === '__ungrouped__') return -1;
      return a.localeCompare(b);
    });
    for (const key of sortedKeys) {
      groupSections.push({
        key,
        label: key !== '__ungrouped__' ? formatGroupLabel(key) : null,
        games: groupMap.get(key)!,
      });
    }
  } else {
    groupSections.push({ key: '__all__', label: null, games: openGames });
  }

  return (
    <div className="space-y-4 pb-28 md:pb-0">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {filled} de {openGames.length} palpite{openGames.length !== 1 ? 's' : ''} preenchido{filled !== 1 ? 's' : ''}
        </span>
        <span className={filled === openGames.length ? 'text-emerald-400 font-medium' : ''}>
          {filled === openGames.length
            ? 'Todos preenchidos!'
            : `${openGames.length - filled} pendente${openGames.length - filled !== 1 ? 's' : ''}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: openGames.length > 0 ? `${(filled / openGames.length) * 100}%` : '0%' }}
        />
      </div>

      {/* Game sections (grouped or flat) */}
      {groupSections.map(({ key, label, games: sectionGames }) => (
        <div key={key} className="space-y-2">
          {/* Group header */}
          {label && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {label}
              </span>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-600">
                {sectionGames.filter((g) => {
                  const p = predictions[g.id];
                  return p && p.home !== '' && p.away !== '';
                }).length}/{sectionGames.length}
              </span>
            </div>
          )}

          <Card>
            <CardContent className="divide-y divide-slate-800 p-0">
              {sectionGames.map((game) => {
                const p = predictions[game.id] ?? { home: '', away: '' };
                const isFilled = p.home !== '' && p.away !== '';
                const deadline = getDeadlineLabel(game.matchDate);
                const urgent = new Date(game.matchDate).getTime() - Date.now() < 3 * 3600000;

                const odds = findOdds(oddsEvents, game.homeTeam, game.awayTeam);

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

                    {/* Odds */}
                    {odds && (
                      <div className="flex justify-center gap-3 mb-2.5">
                        <span className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-slate-600 uppercase tracking-wide">1</span>
                          <span className="text-xs font-semibold text-emerald-400">{odds.home.toFixed(2)}</span>
                        </span>
                        <span className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-slate-600 uppercase tracking-wide">X</span>
                          <span className="text-xs font-semibold text-slate-400">{odds.draw.toFixed(2)}</span>
                        </span>
                        <span className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-slate-600 uppercase tracking-wide">2</span>
                          <span className="text-xs font-semibold text-sky-400">{odds.away.toFixed(2)}</span>
                        </span>
                        <span className="flex items-end pb-0.5 text-[9px] text-slate-700">{odds.bookmaker}</span>
                      </div>
                    )}

                    {/* Home team row */}
                    <div className="flex items-center gap-2">
                      {game.homeCrest ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={game.homeCrest} alt={game.homeTeam} className="h-8 w-8 object-contain shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-800 shrink-0" />
                      )}
                      <span className="flex-1 text-sm font-semibold text-slate-100 min-w-0">{game.homeTeam}</span>
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
                        className={`w-12 h-11 text-center text-lg font-bold rounded-lg border bg-slate-900 text-slate-100 shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors
                          ${isFilled ? 'border-brand-700' : 'border-slate-700'}`}
                      />
                    </div>

                    {/* Away team row */}
                    <div className="flex items-center gap-2 mt-2">
                      {game.awayCrest ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={game.awayCrest} alt={game.awayTeam} className="h-8 w-8 object-contain shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-800 shrink-0" />
                      )}
                      <span className="flex-1 text-sm font-semibold text-slate-100 min-w-0">{game.awayTeam}</span>
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
                        className={`w-12 h-11 text-center text-lg font-bold rounded-lg border bg-slate-900 text-slate-100 shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors
                          ${isFilled ? 'border-brand-700' : 'border-slate-700'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Locked games */}
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

      {/* Save button */}
      <div className="fixed bottom-20 left-0 right-0 z-20 px-4 md:static md:bottom-auto md:px-0">
        <Button
          onClick={save}
          loading={saving}
          className="w-full shadow-lg shadow-black/50 md:shadow-none"
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
