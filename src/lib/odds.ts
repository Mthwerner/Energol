const BASE_ODDS_URL = 'https://api.the-odds-api.com/v4';

export interface OddsH2H {
  home: number;
  draw: number;
  away: number;
  bookmaker: string;
}

export interface OddsEvent {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: { name: string; price: number }[];
    }[];
  }[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function teamsMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function findOdds(
  events: OddsEvent[],
  homeTeam: string,
  awayTeam: string,
): OddsH2H | null {
  const event = events.find(
    (e) => teamsMatch(e.home_team, homeTeam) && teamsMatch(e.away_team, awayTeam),
  );
  if (!event) return null;

  const bm =
    event.bookmakers.find((b) => b.key === 'bet365') ??
    event.bookmakers.find((b) => b.key === 'unibet') ??
    event.bookmakers[0];
  if (!bm) return null;

  const market = bm.markets.find((m) => m.key === 'h2h');
  if (!market) return null;

  const home = market.outcomes.find((o) => teamsMatch(o.name, homeTeam))?.price ?? 0;
  const away = market.outcomes.find((o) => teamsMatch(o.name, awayTeam))?.price ?? 0;
  const draw = market.outcomes.find((o) => o.name === 'Draw')?.price ?? 0;

  if (!home || !away || !draw) return null;
  return { home, draw, away, bookmaker: bm.title };
}

export async function fetchOddsEvents(sportKey: string): Promise<OddsEvent[]> {
  const key = process.env.ODDS_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      `${BASE_ODDS_URL}/sports/${sportKey}/odds/?apiKey=${key}&regions=eu&markets=h2h&oddsFormat=decimal`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    return (await res.json()) as OddsEvent[];
  } catch {
    return [];
  }
}
