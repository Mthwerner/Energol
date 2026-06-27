import { calculateScore } from '@/domain/scoring';
import { Card, CardContent } from '@/components/ui/card';
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
  group?: string | null;
}

interface Props {
  games: Game[];
  predictions: Record<string, { homeScore: number; awayScore: number }>;
  predictionPoints: Record<string, number | null | undefined>;
}

const resultConfig = {
  EXACT:       { label: 'Placar exato',      pts: 10, color: 'text-emerald-400', border: 'border-l-emerald-600', bg: 'bg-emerald-950/30' },
  RESULT_DIFF: { label: 'Resultado + saldo', pts: 7,  color: 'text-cyan-400',    border: 'border-l-cyan-700',    bg: 'bg-cyan-950/20'    },
  RESULT:      { label: 'Resultado certo',   pts: 5,  color: 'text-amber-400',   border: 'border-l-amber-600',   bg: 'bg-amber-950/30'   },
  ONE_SCORE:   { label: 'Um placar certo',   pts: 3,  color: 'text-purple-400',  border: 'border-l-purple-700',  bg: 'bg-purple-950/20'  },
  MISS:        { label: 'Errou',             pts: 0,  color: 'text-red-400',     border: 'border-l-red-800',     bg: 'bg-red-950/20'     },
};

function formatGroupLabel(group: string): string {
  const m = group.match(/GROUP_([A-Z]+)/);
  if (m) return `Grupo ${m[1]}`;
  return group.replace(/_/g, ' ');
}

interface GameRow {
  game: Game;
  pred: { homeScore: number; awayScore: number } | undefined;
  finished: boolean;
  points: number | null;
  type: keyof typeof resultConfig | null;
}

function buildRow(
  game: Game,
  predictions: Props['predictions'],
  predictionPoints: Props['predictionPoints'],
): GameRow {
  const pred = predictions[game.id];
  const finished = game.status === 'FINISHED' && game.homeScore !== null && game.awayScore !== null;

  if (!finished || !pred) return { game, pred, finished, points: null, type: null };

  const stored = predictionPoints[game.id];
  let points: number;
  let type: keyof typeof resultConfig;

  if (stored !== null && stored !== undefined) {
    points = stored;
    if      (points === 10) type = 'EXACT';
    else if (points === 7)  type = 'RESULT_DIFF';
    else if (points === 5)  type = 'RESULT';
    else if (points === 3)  type = 'ONE_SCORE';
    else                    type = 'MISS';
  } else {
    const calc = calculateScore(pred, { homeScore: game.homeScore!, awayScore: game.awayScore! });
    points = calc.points;
    type = calc.result;
  }

  return { game, pred, finished, points, type };
}

function GameResultRow({ row }: { row: GameRow }) {
  const { game, pred, finished, points, type } = row;
  const cfg = type ? resultConfig[type] : null;

  return (
    <div className={`px-4 py-4 border-l-2 ${cfg ? `${cfg.bg} ${cfg.border}` : 'border-l-transparent'}`}>
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <div className="text-right min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">{game.homeTeam}</div>
            <div className="text-xs text-slate-500">{formatDateTime(game.matchDate)}</div>
          </div>
          {game.homeCrest && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.homeCrest} alt={game.homeTeam} className="h-7 w-7 object-contain shrink-0" />
          )}
        </div>

        {/* Scores column */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 w-24">
          {finished ? (
            <div className="flex items-center gap-1">
              <span className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 font-bold text-sm text-slate-100">{game.homeScore}</span>
              <span className="text-slate-600 text-xs">x</span>
              <span className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 font-bold text-sm text-slate-100">{game.awayScore}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-600 italic">em andamento</span>
          )}

          {pred ? (
            <div className="flex items-center gap-1">
              <span className={`w-8 h-7 flex items-center justify-center rounded border border-slate-700 text-xs ${cfg ? cfg.color : 'text-slate-400'}`}>{pred.homeScore}</span>
              <span className="text-slate-700 text-xs">x</span>
              <span className={`w-8 h-7 flex items-center justify-center rounded border border-slate-700 text-xs ${cfg ? cfg.color : 'text-slate-400'}`}>{pred.awayScore}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-600 italic">sem palpite</span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
          {game.awayCrest && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.awayCrest} alt={game.awayTeam} className="h-7 w-7 object-contain shrink-0" />
          )}
          <div className="text-sm font-medium text-slate-200 truncate">{game.awayTeam}</div>
        </div>

        {/* Points */}
        {cfg && points !== null && (
          <div className="shrink-0 text-right">
            <div className={`text-sm font-bold ${cfg.color}`}>+{points}</div>
            <div className={`text-xs ${cfg.color} opacity-70`}>{cfg.label}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function RoundResults({ games, predictions, predictionPoints }: Props) {
  const rows = games.map((g) => buildRow(g, predictions, predictionPoints));

  const finishedCount = rows.filter((r) => r.finished).length;
  const totalPoints   = rows.reduce((sum, r) => sum + (r.points ?? 0), 0);

  // ── Grouping ─────────────────────────────────────────────────────────────
  const hasGroups = games.some((g) => g.group);

  type Section = { key: string; label: string | null; rows: GameRow[] };
  const sections: Section[] = [];

  if (hasGroups) {
    const groupMap = new Map<string, GameRow[]>();
    for (const row of rows) {
      const key = row.game.group ?? '__ungrouped__';
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(row);
    }
    const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => {
      if (a === '__ungrouped__') return 1;
      if (b === '__ungrouped__') return -1;
      return a.localeCompare(b);
    });
    for (const key of sortedKeys) {
      sections.push({
        key,
        label: key !== '__ungrouped__' ? formatGroupLabel(key) : null,
        rows: groupMap.get(key)!,
      });
    }
  } else {
    sections.push({ key: '__all__', label: null, rows });
  }

  return (
    <div className="space-y-4">
      {finishedCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-5 py-3">
          <span className="text-sm text-slate-400">
            Total nesta rodada ({finishedCount} jogo{finishedCount !== 1 ? 's' : ''} finalizado{finishedCount !== 1 ? 's' : ''})
          </span>
          <span className="text-xl font-bold text-slate-100">{totalPoints} pts</span>
        </div>
      )}

      {sections.map(({ key, label, rows: sectionRows }) => (
        <div key={key} className="space-y-2">
          {label && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
          )}
          <Card>
            <CardContent className="divide-y divide-slate-800 p-0">
              {sectionRows.map((row) => (
                <GameResultRow key={row.game.id} row={row} />
              ))}
            </CardContent>
          </Card>
        </div>
      ))}

      <div className="text-xs text-slate-600 text-center">
        Placar maior = resultado real · Placar menor = seu palpite
      </div>
    </div>
  );
}
