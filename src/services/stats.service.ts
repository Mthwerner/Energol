import { prisma } from '@/lib/prisma';
import { getPoolRanking } from './ranking.service';

interface GameStat {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: Date;
  total: number;
  correctPct: number;
}

export interface PoolStats {
  totalGamesFinished: number;
  totalPredictions: number;
  overallCorrectPct: number;
  pointsDistribution: {
    exact: number;
    diffScore: number;
    correct: number;
    one: number;
    wrong: number;
  };
  topExact: Array<{ name: string; count: number }>;
  hardestGame: GameStat | null;
  easiestGame: GameStat | null;
  bestRound: { name: string; participant: string; points: number } | null;
}

export async function getPoolStats(poolId: string): Promise<PoolStats> {
  const [games, allPredictions, bestRoundScore, ranking] = await Promise.all([
    prisma.game.findMany({
      where: { round: { poolId }, status: 'FINISHED' },
      include: { predictions: { select: { points: true } } },
      orderBy: [{ matchDate: 'asc' }, { id: 'asc' }],
    }),
    prisma.prediction.findMany({
      where: { game: { round: { poolId }, status: 'FINISHED' }, points: { not: null } },
      // basePoints é a pontuação-base sem multiplicador de fase; usado nos contadores de tier
      select: { points: true, basePoints: true },
    }),
    prisma.participantScore.findFirst({
      where: { round: { poolId } },
      orderBy: { totalPoints: 'desc' },
      include: {
        participant: { include: { user: { select: { name: true } } } },
        round: { select: { name: true } },
      },
    }),
    getPoolRanking(poolId),
  ]);

  const totalGamesFinished = games.length;
  const totalPredictions = allPredictions.length;

  // Contadores de tier por pontuação-BASE (sem multiplicador de fase).
  // Predições antigas (basePoints = null) usam points como fallback pois nunca
  // tiveram peso aplicado — a igualdade ainda é correta.
  const dist = {
    exact:     allPredictions.filter((p) => (p.basePoints ?? p.points) === 10).length,
    diffScore: allPredictions.filter((p) => (p.basePoints ?? p.points) === 7).length,
    correct:   allPredictions.filter((p) => (p.basePoints ?? p.points) === 5).length,
    one:       allPredictions.filter((p) => (p.basePoints ?? p.points) === 3).length,
    wrong:     allPredictions.filter((p) => (p.basePoints ?? p.points) === 0).length,
  };

  const correctTotal = dist.exact + dist.diffScore + dist.correct + dist.one;
  const overallCorrectPct =
    totalPredictions > 0 ? Math.round((correctTotal / totalPredictions) * 100) : 0;

  const gameStats: GameStat[] = games
    .filter((g) => g.predictions.length >= 2)
    .map((g) => ({
      homeTeam:   g.homeTeam,
      awayTeam:   g.awayTeam,
      homeScore:  g.homeScore!,
      awayScore:  g.awayScore!,
      matchDate:  g.matchDate,
      total:      g.predictions.length,
      correctPct: g.predictions.filter((p) => (p.points ?? 0) > 0).length / g.predictions.length,
    }));

  let hardestGame: GameStat | null = null;
  let easiestGame: GameStat | null = null;

  if (gameStats.length > 0) {
    hardestGame = gameStats.reduce((a, b) => (a.correctPct <= b.correctPct ? a : b));
    easiestGame = gameStats.reduce((a, b) => (a.correctPct >= b.correctPct ? a : b));
    // If same game, only show hardest
    if (easiestGame.homeTeam === hardestGame.homeTeam && easiestGame.awayTeam === hardestGame.awayTeam) {
      easiestGame = null;
    }
  }

  const topExact = ranking
    .filter((r) => r.exactScores > 0)
    .sort((a, b) => b.exactScores - a.exactScores)
    .slice(0, 3)
    .map((r) => ({ name: r.name, count: r.exactScores }));

  const bestRound = bestRoundScore
    ? {
        name:        bestRoundScore.round.name,
        participant: bestRoundScore.participant.user.name,
        points:      bestRoundScore.totalPoints,
      }
    : null;

  return {
    totalGamesFinished,
    totalPredictions,
    overallCorrectPct,
    pointsDistribution: dist,
    topExact,
    hardestGame,
    easiestGame,
    bestRound,
  };
}
