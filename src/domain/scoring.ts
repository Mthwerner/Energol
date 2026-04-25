export const POINTS = {
  EXACT: 10,
  RESULT: 5,
  MISS: 0,
} as const;

export type PredictionResult = 'EXACT' | 'RESULT' | 'MISS';

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
  actual: { homeScore: number; awayScore: number },
): ScoreCalculation {
  if (predicted.homeScore === actual.homeScore && predicted.awayScore === actual.awayScore) {
    return { result: 'EXACT', points: POINTS.EXACT };
  }

  if (getOutcome(predicted.homeScore, predicted.awayScore) === getOutcome(actual.homeScore, actual.awayScore)) {
    return { result: 'RESULT', points: POINTS.RESULT };
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
    if (calc.result === 'RESULT') correctResults++;
  }

  return { totalPoints, exactScores, correctResults };
}
