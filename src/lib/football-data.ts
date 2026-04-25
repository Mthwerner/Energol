const BASE_URL = 'https://api.football-data.org/v4';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface FDScore {
  winner: string | null;
  duration: string;
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'CANCELLED' | 'POSTPONED' | 'SUSPENDED' | 'AWARDED';
  stage: FDStage;
  group: string | null;
  matchday: number | null;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: FDScore;
}

export type FDStage =
  | 'GROUP_STAGE'
  | 'LAST_32'
  | 'LAST_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'THIRD_PLACE'
  | 'FINAL'
  | 'REGULAR_SEASON';

// ─── Round mapping ───────────────────────────────────────────────────────────

export interface RoundDef {
  number: number;
  name: string;
  stage: FDStage;
  matchday?: number;
}

export const WC2026_ROUNDS: RoundDef[] = [
  { number: 1, name: 'Fase de Grupos – 1ª Rodada', stage: 'GROUP_STAGE', matchday: 1 },
  { number: 2, name: 'Fase de Grupos – 2ª Rodada', stage: 'GROUP_STAGE', matchday: 2 },
  { number: 3, name: 'Fase de Grupos – 3ª Rodada', stage: 'GROUP_STAGE', matchday: 3 },
  { number: 4, name: 'Rodada de 32',               stage: 'LAST_32' },
  { number: 5, name: 'Oitavas de Final',            stage: 'LAST_16' },
  { number: 6, name: 'Quartas de Final',            stage: 'QUARTER_FINALS' },
  { number: 7, name: 'Semifinais',                  stage: 'SEMI_FINALS' },
  { number: 8, name: 'Disputa pelo 3° Lugar',       stage: 'THIRD_PLACE' },
  { number: 9, name: 'Final',                       stage: 'FINAL' },
];

// ─── API helpers ─────────────────────────────────────────────────────────────

function headers() {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error('FOOTBALL_DATA_API_KEY não configurada no .env');
  return { 'X-Auth-Token': key };
}

export async function fetchWC2026Matches(): Promise<FDMatch[]> {
  const res = await fetch(`${BASE_URL}/competitions/WC/matches?season=2026`, {
    headers: headers(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`football-data.org ${res.status}: ${body}`);
  }

  const data = await res.json() as { matches: FDMatch[] };
  return data.matches;
}

export async function fetchWC2026Match(externalId: number): Promise<FDMatch> {
  const res = await fetch(`${BASE_URL}/matches/${externalId}`, {
    headers: headers(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`football-data.org ${res.status}: ${body}`);
  }

  const data = await res.json() as { match: FDMatch };
  return data.match;
}

// ─── Util ────────────────────────────────────────────────────────────────────

/** Mapeia status da API para GameStatus do Prisma */
export function toGameStatus(fdStatus: FDMatch['status']): 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' {
  switch (fdStatus) {
    case 'IN_PLAY':
    case 'PAUSED':
      return 'LIVE';
    case 'FINISHED':
    case 'AWARDED':
      return 'FINISHED';
    case 'CANCELLED':
    case 'POSTPONED':
    case 'SUSPENDED':
      return 'CANCELLED';
    default:
      return 'SCHEDULED';
  }
}

/** Encontra a RoundDef correspondente a um FDMatch */
export function getRoundDef(match: FDMatch, rounds: RoundDef[] = WC2026_ROUNDS): RoundDef | undefined {
  return rounds.find((r) => {
    if (r.stage !== match.stage) return false;
    if (r.matchday !== undefined) return r.matchday === match.matchday;
    return true;
  });
}

// ─── Brasileirão Série A 2026 ────────────────────────────────────────────────

export const BSA2026_ROUNDS: RoundDef[] = Array.from({ length: 38 }, (_, i) => ({
  number: i + 1,
  name: `Rodada ${i + 1}`,
  stage: 'REGULAR_SEASON' as FDStage,
  matchday: i + 1,
}));

export async function fetchBR2026Matches(): Promise<FDMatch[]> {
  const res = await fetch(`${BASE_URL}/competitions/BSA/matches?season=2026`, {
    headers: headers(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`football-data.org ${res.status}: ${body}`);
  }

  const data = await res.json() as { matches: FDMatch[] };
  return data.matches;
}

// ─── Standings ───────────────────────────────────────────────────────────────

export interface FDStandingEntry {
  position: number;
  team: Pick<FDTeam, 'id' | 'name' | 'shortName' | 'crest'>;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string | null;
}

export interface FDStandingTable {
  stage: string;
  type: 'TOTAL' | 'HOME' | 'AWAY';
  group: string | null;
  table: FDStandingEntry[];
}

export async function fetchStandings(competition: 'BSA' | 'WC'): Promise<FDStandingTable[]> {
  const res = await fetch(`${BASE_URL}/competitions/${competition}/standings`, {
    headers: headers(),
    next: { revalidate: 1800, tags: [`standings-${competition}`] },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`football-data.org ${res.status}: ${body}`);
  }

  const data = await res.json() as { standings: FDStandingTable[] };
  return data.standings;
}

/** Data mínima de uma lista de partidas */
export function minDate(matches: FDMatch[]): Date {
  return new Date(Math.min(...matches.map((m) => new Date(m.utcDate).getTime())));
}

/** Data máxima + 2h de uma lista de partidas */
export function maxDate(matches: FDMatch[]): Date {
  const max = Math.max(...matches.map((m) => new Date(m.utcDate).getTime()));
  return new Date(max + 2 * 60 * 60 * 1000);
}
