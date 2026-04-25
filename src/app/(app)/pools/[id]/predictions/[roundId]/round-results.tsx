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
}

interface Props {
  games: Game[];
  predictions: Record<string, { homeScore: number; awayScore: number }>;
  predictionPoints: Record<string, number | null | undefined>;
}

const resultConfig = {
  EXACT:       { label: 'Placar exato',          pts: 10, color: 'text-emerald-400', border: 'border-l-emerald-600', bg: 'bg-emerald-950/30' },
  RESULT_DIFF: { label: 'Resultado + saldo',     pts: 7,  color: 'text-cyan-400',    border: 'border-l-cyan-700',    bg: 'bg-cyan-950/20'    },
  RESULT:      { label: 'Resultado certo',       pts: 5,  color: 'text-amber-400',   border: 'border-l-amber-600',   bg: 'bg-amber-950/30'   },
  ONE_SCORE:   { label: 'Um placar certo',       pts: 3,  color: 'text-purple-400',  border: 'border-l-purple-700',  bg: 'bg-purple-950/20'  },
  MISS:        { label: 'Errou',                 pts: 0,  color: 'text-red-400',     border: 'border-l-red-800',     bg: 'bg-red-950/20'     },
};

export function RoundResults({ games, predictions, predictionPoints }: Props) {
  let totalPoints = 0;
  let finishedCount = 0;

  const rows = games.map((game) => {
    const pred = predictions[game.id];
    const finished = game.status === 'FINISHED' && game.homeScore !== null && game.awayScore !== null;

    if (!finished || !pred) return { game, pred, finished, points: null, type: null };

    finishedCount++;
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

    totalPoints += points;
    return { game, pred, finished, points, type };
  });

  return (
    <div className="space-y-3">
      {finishedCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-5 py-3">
          <span className="text-sm text-slate-400">
            Total nesta rodada ({finishedCount} jogo{finishedCount !== 1 ? 's' : ''} finalizado{finishedCount !== 1 ? 's' : ''})
          </span>
          <span className="text-xl font-bold text-slate-100">{totalPoints} pts</span>
        </div>
      )}

      <Card>
        <CardContent className="divide-y divide-slate-800 p-0">
          {rows.map(({ game, pred, finished, points, type }) => {
            const cfg = type ? resultConfig[type] : null;
            return (
              <div
                key={game.id}
                className={`px-4 py-4 border-l-2 ${cfg ? `${cfg.bg} ${cfg.border}` : 'border-l-transparent'}`}
              >
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
          })}
        </CardContent>
      </Card>

      <div className="text-xs text-slate-600 text-center">
        Placar maior = resultado real · Placar menor = seu palpite
      </div>
    </div>
  );
}
