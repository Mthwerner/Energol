export const POINTS = {
  EXACT:       10,
  RESULT_DIFF:  7,
  RESULT:       5,
  ONE_SCORE:    3,
  MISS:         0,
} as const;

export type PredictionResult = 'EXACT' | 'RESULT_DIFF' | 'RESULT' | 'ONE_SCORE' | 'MISS';

export interface ScoreCalculation {
  result: PredictionResult;
  points: number;
}

type MatchOutcome = 'HOME' | 'DRAW' | 'AWAY';

function getOutcome(home: number, away: number): MatchOutcome {
  if (home > away) return 'HOME';
  if (home < away) return 'AWAY';
  return 'DRAW';
}

export function calculateScore(
  predicted: { homeScore: number; awayScore: number },
  actual:    { homeScore: number; awayScore: number },
): ScoreCalculation {
  const { homeScore: pH, awayScore: pA } = predicted;
  const { homeScore: aH, awayScore: aA } = actual;

  // Placar exato
  if (pH === aH && pA === aA) {
    return { result: 'EXACT', points: POINTS.EXACT };
  }

  const predOutcome = getOutcome(pH, pA);
  const actOutcome  = getOutcome(aH, aA);
  const sameResult  = predOutcome === actOutcome;

  // Resultado certo + saldo de gols certo (ex: 2-0 vs 3-1)
  if (sameResult && (pH - pA) === (aH - aA)) {
    return { result: 'RESULT_DIFF', points: POINTS.RESULT_DIFF };
  }

  // Resultado certo (vencedor/empate)
  if (sameResult) {
    return { result: 'RESULT', points: POINTS.RESULT };
  }

  // Placar de um time certo (ex: acertou o 2 do time da casa)
  if (pH === aH || pA === aA) {
    return { result: 'ONE_SCORE', points: POINTS.ONE_SCORE };
  }

  return { result: 'MISS', points: POINTS.MISS };
}

export interface GameWithPrediction {
  homeScore: number;
  awayScore: number;
  prediction: { homeScore: number; awayScore: number } | null;
}

export function scoreRound(games: GameWithPrediction[]): {
  totalPoints: number;
  exactScores: number;
  correctResults: number;
} {
  let totalPoints = 0;
  let exactScores = 0;
  let correctResults = 0;

  for (const game of games) {
    if (!game.prediction) continue;

    const calc = calculateScore(game.prediction, game);
    totalPoints += calc.points;
    if (calc.result === 'EXACT') exactScores++;
    if (calc.result === 'RESULT' || calc.result === 'RESULT_DIFF') correctResults++;
  }

  return { totalPoints, exactScores, correctResults };
}
