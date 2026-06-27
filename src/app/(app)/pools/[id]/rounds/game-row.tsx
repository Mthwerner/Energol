'use client';

import { useState, useCallback } from 'react';
import { CheckCircle2, Check, Pencil } from 'lucide-react';
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

interface Team { name: string; crest: string | null }

interface Props {
  game: Game;
  poolId: string;
  roundId: string;
  onResultSet: (homeScore: number, awayScore: number) => void;
  onTeamsSet?: (homeTeam: string, awayTeam: string) => void;
}

export function GameRow({ game, poolId, roundId, onResultSet, onTeamsSet }: Props) {
  // --- resultado ---
  const [open, setOpen] = useState(false);
  const [home, setHome] = useState(String(game.homeScore ?? ''));
  const [away, setAway] = useState(String(game.awayScore ?? ''));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- editar times ---
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [homeTeam, setHomeTeam] = useState(game.homeTeam);
  const [awayTeam, setAwayTeam] = useState(game.awayTeam);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsSaving, setTeamsSaving] = useState(false);
  const [teamsSaved, setTeamsSaved] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const openTeamsModal = useCallback(async () => {
    setHomeTeam(game.homeTeam);
    setAwayTeam(game.awayTeam);
    setTeamsSaved(false);
    setTeamsError(null);
    setTeamsOpen(true);
    if (teams.length === 0) {
      const res = await fetch(`/api/pools/${poolId}/teams`);
      if (res.ok) setTeams(await res.json());
    }
  }, [game.homeTeam, game.awayTeam, poolId, teams.length]);

  const saveTeams = async () => {
    if (!homeTeam.trim() || !awayTeam.trim()) return;
    setTeamsSaving(true);
    setTeamsError(null);
    try {
      const res = await fetch(`/api/pools/${poolId}/rounds/${roundId}/games/${game.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeTeam: homeTeam.trim(), awayTeam: awayTeam.trim() }),
      });
      if (res.ok) {
        onTeamsSet?.(homeTeam.trim(), awayTeam.trim());
        setTeamsSaved(true);
        setTimeout(() => { setTeamsSaved(false); setTeamsOpen(false); }, 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        setTeamsError(data.error ?? `Erro ${res.status}`);
      }
    } catch {
      setTeamsError('Erro de conexão. Tente novamente.');
    } finally {
      setTeamsSaving(false);
    }
  };

  const save = async () => {
    const hs = parseInt(home);
    const as = parseInt(away);
    if (isNaN(hs) || isNaN(as)) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${game.id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore: hs, awayScore: as }),
      });

      if (res.ok) {
        onResultSet(hs, as);
        setSaved(true);
        setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Erro ${res.status} ao salvar resultado`);
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const hasUndefined = game.homeTeam === 'A definir' || game.awayTeam === 'A definir';
  const datalistId = `teams-list-${game.id}`;

  return (
    <>
      <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 space-y-2">
        {/* Linha 1: times */}
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          {game.homeCrest && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.homeCrest} alt={game.homeTeam} className="h-6 w-6 object-contain shrink-0" />
          )}
          <span className={`flex-1 font-medium truncate text-right ${hasUndefined ? 'text-slate-500 italic' : 'text-slate-200'}`}>
            {game.homeTeam}
          </span>
          {game.status === 'FINISHED' ? (
            <span className="font-bold text-slate-100 shrink-0 px-1">{game.homeScore} × {game.awayScore}</span>
          ) : (
            <span className="text-slate-600 shrink-0 px-1 text-xs">vs</span>
          )}
          <span className={`flex-1 font-medium truncate ${hasUndefined ? 'text-slate-500 italic' : 'text-slate-200'}`}>
            {game.awayTeam}
          </span>
          {game.awayCrest && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.awayCrest} alt={game.awayTeam} className="h-6 w-6 object-contain shrink-0" />
          )}
        </div>

        {/* Linha 2: data + status + botões */}
        <div className="flex items-center justify-between">
          {game.status !== 'FINISHED' ? (
            <span className="text-xs text-slate-500">{formatDateTime(game.matchDate)}</span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <GameStatusBadge status={game.status} />
            {game.status !== 'FINISHED' && (
              <Button size="sm" variant="secondary" onClick={openTeamsModal} className="h-7 text-xs">
                <Pencil size={12} />
                Times
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)} className="h-7 text-xs">
              <CheckCircle2 size={13} />
              {game.status === 'FINISHED' ? 'Editar' : 'Resultado'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal: definir times */}
      <Modal open={teamsOpen} onClose={() => !teamsSaving && setTeamsOpen(false)} title="Definir times">
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Digite ou selecione as seleções para este jogo. Use a lista de sugestões com os times já cadastrados no bolão.
          </p>

          <datalist id={datalistId}>
            {teams.map((t) => <option key={t.name} value={t.name} />)}
          </datalist>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Time da casa</label>
              <input
                list={datalistId}
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                placeholder="Ex: Brazil"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Time visitante</label>
              <input
                list={datalistId}
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                placeholder="Ex: Argentina"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {teamsSaved && (
            <div className="flex items-center justify-center gap-2 rounded-md bg-emerald-950 border border-emerald-800 px-3 py-2 text-sm text-emerald-300">
              <Check size={14} /> Times atualizados!
            </div>
          )}
          {teamsError && (
            <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
              {teamsError}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button onClick={saveTeams} loading={teamsSaving} disabled={teamsSaved || !homeTeam.trim() || !awayTeam.trim()} className="flex-1">
              {teamsSaved ? <><Check size={14} /> Salvo!</> : 'Salvar times'}
            </Button>
            <Button variant="secondary" onClick={() => setTeamsOpen(false)} disabled={teamsSaving}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: registrar resultado */}
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
          {saved && (
            <div className="flex items-center justify-center gap-2 rounded-md bg-emerald-950 border border-emerald-800 px-3 py-2 text-sm text-emerald-300">
              <Check size={14} /> Resultado salvo!
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button onClick={save} loading={saving} disabled={saved} className="flex-1">
              {saved ? <><Check size={14} /> Salvo!</> : 'Salvar resultado'}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
