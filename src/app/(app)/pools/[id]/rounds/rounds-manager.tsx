'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { RoundStatusBadge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { GameRow } from './game-row';

interface Round {
  id: string;
  number: number;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  _count: { games: number };
}

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

const roundSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  startDate: z.string().min(1, 'Data obrigatória'),
  endDate: z.string().min(1, 'Data obrigatória'),
});

const gameSchema = z.object({
  homeTeam: z.string().min(2, 'Obrigatório'),
  awayTeam: z.string().min(2, 'Obrigatório'),
  matchDate: z.string().min(1, 'Data obrigatória'),
});

type RoundForm = z.infer<typeof roundSchema>;
type GameForm = z.infer<typeof gameSchema>;

export function RoundsManager({ poolId, initialRounds }: { poolId: string; initialRounds: Round[] }) {
  const [rounds, setRounds] = useState<Round[]>(initialRounds);
  const [openRoundId, setOpenRoundId] = useState<string | null>(null);
  const [games, setGames] = useState<Record<string, Game[]>>({});
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [addGameRoundId, setAddGameRoundId] = useState<string | null>(null);

  const roundForm = useForm<RoundForm>({ resolver: zodResolver(roundSchema) });
  const gameForm = useForm<GameForm>({ resolver: zodResolver(gameSchema) });

  const loadGames = async (roundId: string) => {
    if (games[roundId]) return;
    const res = await fetch(`/api/pools/${poolId}/rounds/${roundId}/games`);
    const data = await res.json();
    setGames((prev) => ({ ...prev, [roundId]: data }));
  };

  const toggleRound = async (roundId: string) => {
    if (openRoundId === roundId) {
      setOpenRoundId(null);
    } else {
      setOpenRoundId(roundId);
      await loadGames(roundId);
    }
  };

  const createRound = async (data: RoundForm) => {
    const res = await fetch(`/api/pools/${poolId}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      }),
    });
    if (!res.ok) return;
    const round = await res.json();
    setRounds((prev) => [...prev, { ...round, _count: { games: 0 } }]);
    roundForm.reset();
    setShowRoundModal(false);
  };

  const createGame = async (data: GameForm) => {
    if (!addGameRoundId) return;
    const res = await fetch(`/api/pools/${poolId}/rounds/${addGameRoundId}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, matchDate: new Date(data.matchDate).toISOString() }),
    });
    if (!res.ok) return;
    const game = await res.json();
    setGames((prev) => ({ ...prev, [addGameRoundId]: [...(prev[addGameRoundId] ?? []), game] }));
    setRounds((prev) => prev.map((r) => r.id === addGameRoundId ? { ...r, _count: { games: r._count.games + 1 } } : r));
    gameForm.reset();
    setAddGameRoundId(null);
  };

  const onResultSet = (roundId: string, gameId: string, homeScore: number, awayScore: number) => {
    setGames((prev) => ({
      ...prev,
      [roundId]: (prev[roundId] ?? []).map((g) =>
        g.id === gameId ? { ...g, homeScore, awayScore, status: 'FINISHED' } : g,
      ),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium text-slate-400">{rounds.length} rodada{rounds.length !== 1 ? 's' : ''}</h2>
        <Button size="sm" onClick={() => setShowRoundModal(true)}>
          <Plus size={14} /> Nova rodada
        </Button>
      </div>

      {rounds.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Nenhuma rodada criada ainda
          </CardContent>
        </Card>
      )}

      {rounds.map((round) => (
        <Card key={round.id}>
          <CardContent className="p-0">
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              onClick={() => toggleRound(round.id)}
            >
              <div className="flex items-center gap-3">
                {openRoundId === round.id ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                <div>
                  <div className="font-medium text-slate-100">{round.name}</div>
                  <div className="text-xs text-slate-500">
                    {formatDate(round.startDate)} — {formatDate(round.endDate)} · {round._count.games} jogo{round._count.games !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <RoundStatusBadge status={round.status} />
            </button>

            {openRoundId === round.id && (
              <div className="border-t border-slate-800 px-5 pb-5 pt-4">
                <div className="space-y-2 mb-4">
                  {(games[round.id] ?? []).map((game) => (
                    <GameRow
                      key={game.id}
                      game={game}
                      poolId={poolId}
                      roundId={round.id}
                      onResultSet={(hs, as) => onResultSet(round.id, game.id, hs, as)}
                    />
                  ))}
                  {(games[round.id] ?? []).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-2">Nenhum jogo cadastrado</p>
                  )}
                </div>
                <Button size="sm" variant="secondary" onClick={() => { setAddGameRoundId(round.id); gameForm.reset(); }}>
                  <Plus size={13} /> Adicionar jogo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Create round modal */}
      <Modal open={showRoundModal} onClose={() => setShowRoundModal(false)} title="Nova rodada">
        <form onSubmit={roundForm.handleSubmit(createRound)} className="space-y-4">
          <Input {...roundForm.register('name')} label="Nome" placeholder="Rodada 1" error={roundForm.formState.errors.name?.message} />
          <Input {...roundForm.register('startDate')} label="Data início" type="datetime-local" error={roundForm.formState.errors.startDate?.message} />
          <Input {...roundForm.register('endDate')} label="Data fim" type="datetime-local" error={roundForm.formState.errors.endDate?.message} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={roundForm.formState.isSubmitting}>Criar</Button>
            <Button type="button" variant="secondary" onClick={() => setShowRoundModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* Add game modal */}
      <Modal open={!!addGameRoundId} onClose={() => setAddGameRoundId(null)} title="Adicionar jogo">
        <form onSubmit={gameForm.handleSubmit(createGame)} className="space-y-4">
          <Input {...gameForm.register('homeTeam')} label="Time da casa" placeholder="Flamengo" error={gameForm.formState.errors.homeTeam?.message} />
          <Input {...gameForm.register('awayTeam')} label="Time visitante" placeholder="Palmeiras" error={gameForm.formState.errors.awayTeam?.message} />
          <Input {...gameForm.register('matchDate')} label="Data e hora" type="datetime-local" error={gameForm.formState.errors.matchDate?.message} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={gameForm.formState.isSubmitting}>Adicionar</Button>
            <Button type="button" variant="secondary" onClick={() => setAddGameRoundId(null)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
