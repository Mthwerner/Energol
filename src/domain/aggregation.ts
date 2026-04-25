export interface RoundStats {
  totalGames: number;
  finishedGames: number;
  totalPredictions: number;
  totalParticipants: number;
  averagePoints: number;
  topScore: number;
}

export interface PoolStats {
  totalRounds: number;
  finishedRounds: number;
  openRounds: number;
  totalParticipants: number;
  totalGames: number;
}

export function aggregateRoundStats(data: {
  games: { status: string }[];
  scores: { totalPoints: number }[];
  participantCount: number;
}): RoundStats {
  const finishedGames = data.games.filter((g) => g.status === 'FINISHED').length;
  const totalPoints = data.scores.reduce((sum, s) => sum + s.totalPoints, 0);
  const topScore = data.scores.reduce((max, s) => Math.max(max, s.totalPoints), 0);

  return {
    totalGames: data.games.length,
    finishedGames,
    totalPredictions: 0,
    totalParticipants: data.participantCount,
    averagePoints: data.scores.length > 0 ? totalPoints / data.scores.length : 0,
    topScore,
  };
}

export function aggregatePoolStats(data: {
  rounds: { status: string }[];
  participants: unknown[];
  games: unknown[];
}): PoolStats {
  return {
    totalRounds: data.rounds.length,
    finishedRounds: data.rounds.filter((r) => r.status === 'FINISHED').length,
    openRounds: data.rounds.filter((r) => r.status === 'OPEN').length,
    totalParticipants: data.participants.length,
    totalGames: data.games.length,
  };
}
