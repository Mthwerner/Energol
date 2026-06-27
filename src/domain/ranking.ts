export interface RankingEntry {
  userId: string;
  name: string;
  avatar: string | null;
  totalPoints: number;
  exactScores: number;
  resultDiffScores: number;
  correctResults: number;
  oneScores: number;
  roundsPlayed: number;
  position: number;
  previousPosition?: number;
}

export type RankingInput = Omit<RankingEntry, 'position'>;

/**
 * Tiebreaker order:
 * 1. totalPoints DESC
 * 2. exactScores DESC
 * 3. correctResults DESC
 * 4. roundsPlayed ASC (less rounds played = higher average)
 * 5. name ASC (alphabetical)
 */
export function buildRanking(entries: RankingInput[]): RankingEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
    if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults;
    if (a.roundsPlayed !== b.roundsPlayed) return a.roundsPlayed - b.roundsPlayed;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((entry, idx) => ({ ...entry, position: idx + 1 }));
}
