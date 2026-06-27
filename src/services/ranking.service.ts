import { prisma } from '@/lib/prisma';
import { buildRanking } from '@/domain/ranking';

export interface PendingAlert {
  roundName: string;
  roundEndDate: Date;
  pending: { userId: string; name: string }[];
}

export async function getPoolRanking(poolId: string) {
  const participants = await prisma.participant.findMany({
    where: { poolId, isActive: true },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      scores: { select: { totalPoints: true, exactScores: true, correctResults: true } },
    },
  });

  // Busca predições com basePoints para classificar tiers sem se confundir com
  // o multiplicador de fase. basePoints nulo = predição anterior ao peso (fase de grupos,
  // weight=1), então points == basePoints nesses casos — fallback seguro.
  const rawPreds = await prisma.prediction.findMany({
    where: {
      userId: { in: participants.map((p) => p.user.id) },
      game: { round: { poolId } },
      points: { not: null },
    },
    select: { userId: true, points: true, basePoints: true },
  });

  // Monta dois lookups a partir das predições brutas:
  //   tierMap:   userId → { pontoBase: quantidade }   — tier usa basePoints sem multiplicador
  //   totalMap:  userId → totalPoints ponderado       — soma prediction.points (inclui rodadas IN_PROGRESS)
  // IMPORTANTE: não usar ParticipantScore aqui pois ele só existe para rodadas 100% finalizadas;
  // rodadas IN_PROGRESS com jogos já pontuados ficariam fora do total.
  const tierMap: Record<string, Record<number, number>> = {};
  const totalMap: Record<string, number> = {};
  for (const pred of rawPreds) {
    const base = pred.basePoints ?? pred.points; // fallback para dados antigos sem peso
    if (base === null || pred.points === null) continue;
    if (!tierMap[pred.userId]) tierMap[pred.userId] = {};
    tierMap[pred.userId][base] = (tierMap[pred.userId][base] ?? 0) + 1;
    totalMap[pred.userId] = (totalMap[pred.userId] ?? 0) + pred.points;
  }

  const entries = participants.map((p) => {
    const uid = p.user.id;
    const t = tierMap[uid] ?? {};
    const totalPoints = totalMap[uid] ?? 0;
    return {
      userId: uid,
      name: p.user.name,
      avatar: p.user.avatar,
      totalPoints,
      exactScores:      t[10] ?? 0,
      resultDiffScores: t[7]  ?? 0,
      correctResults:   t[5]  ?? 0,
      oneScores:        t[3]  ?? 0,
      roundsPlayed:     p.scores.length,
    };
  });

  return buildRanking(entries);
}

export async function getRoundRanking(roundId: string) {
  const scores = await prisma.participantScore.findMany({
    where: { roundId },
    include: {
      participant: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
    orderBy: { totalPoints: 'desc' },
  });

  // Per-tier counts — usa basePoints (sem multiplicador de fase) para não
  // confundir resultado_correto×2 (=10) com placar_exato no tiebreaker.
  const userIds = scores.map((s) => s.participant.user.id);
  const rawPreds = await prisma.prediction.findMany({
    where: {
      userId: { in: userIds },
      game: { roundId },
      points: { not: null },
    },
    select: { userId: true, points: true, basePoints: true },
  });

  const tierMap: Record<string, Record<number, number>> = {};
  for (const pred of rawPreds) {
    const base = pred.basePoints ?? pred.points; // fallback para dados antigos sem peso
    if (base === null) continue;
    if (!tierMap[pred.userId]) tierMap[pred.userId] = {};
    tierMap[pred.userId][base] = (tierMap[pred.userId][base] ?? 0) + 1;
  }

  return scores.map((s, idx) => {
    const uid = s.participant.user.id;
    const t = tierMap[uid] ?? {};
    return {
      position:         idx + 1,
      userId:           uid,
      name:             s.participant.user.name,
      totalPoints:      s.totalPoints,
      exactScores:      t[10] ?? 0,
      resultDiffScores: t[7]  ?? 0,
      correctResults:   t[5]  ?? 0,
      oneScores:        t[3]  ?? 0,
    };
  });
}

export interface RankingHistory {
  rounds: { id: string; name: string; number: number }[];
  participants: { userId: string; name: string; roundPoints: (number | null)[] }[];
}

export async function getRankingHistory(poolId: string): Promise<RankingHistory | null> {
  const rounds = await prisma.round.findMany({
    where: { poolId, status: 'FINISHED' },
    orderBy: { number: 'asc' },
    select: { id: true, name: true, number: true },
  });

  if (rounds.length < 2) return null;

  const scores = await prisma.participantScore.findMany({
    where: { roundId: { in: rounds.map((r) => r.id) } },
    include: {
      participant: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  const byUser = new Map<string, { name: string; roundScores: Map<string, number> }>();
  for (const score of scores) {
    const uid = score.participant.userId;
    if (!byUser.has(uid)) {
      byUser.set(uid, { name: score.participant.user.name ?? 'Usuário', roundScores: new Map() });
    }
    byUser.get(uid)!.roundScores.set(score.roundId, score.totalPoints);
  }

  const participants = Array.from(byUser.entries()).map(([userId, data]) => ({
    userId,
    name: data.name,
    roundPoints: rounds.map((r) => data.roundScores.get(r.id) ?? null),
  }));

  participants.sort((a, b) => {
    const aTotal = a.roundPoints.reduce((s: number, p) => s + (p ?? 0), 0);
    const bTotal = b.roundPoints.reduce((s: number, p) => s + (p ?? 0), 0);
    return bTotal - aTotal;
  });

  return { rounds, participants };
}

export async function getPoolRoundRankings(poolId: string) {
  const rounds = await prisma.round.findMany({
    where: { poolId, status: 'FINISHED' },
    orderBy: { number: 'desc' },
    include: {
      scores: {
        orderBy: { totalPoints: 'desc' },
        include: {
          participant: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
          },
        },
      },
    },
  });

  return rounds.map((round) => ({
    id: round.id,
    name: round.name,
    participants: round.scores.map((score, idx) => ({
      position:    idx + 1,
      userId:      score.participant.user.id,
      name:        score.participant.user.name,
      avatar:      score.participant.user.avatar,
      totalPoints: score.totalPoints,
      exactScores: score.exactScores,
    })),
  }));
}

export async function getPendingPredictionsAlert(poolId: string): Promise<PendingAlert | null> {
  const now = new Date();

  // Rodada mais próxima de fechar (menor endDate ainda no futuro)
  const round = await prisma.round.findFirst({
    where: { poolId, status: { in: ['OPEN', 'IN_PROGRESS'] }, endDate: { gt: now } },
    orderBy: { endDate: 'asc' },
    include: { games: { select: { id: true } } },
  });

  if (!round || round.games.length === 0) return null;

  const gameIds = round.games.map((g) => g.id);

  // Participantes ativos do bolão
  const participants = await prisma.participant.findMany({
    where: { poolId, isActive: true },
    include: { user: { select: { id: true, name: true } } },
  });

  // Quais participantes têm ao menos 1 palpite nesta rodada
  const withPrediction = await prisma.prediction.findMany({
    where: { gameId: { in: gameIds } },
    select: { userId: true },
    distinct: ['userId'],
  });

  const withPredictionIds = new Set(withPrediction.map((p) => p.userId));

  const pending = participants
    .filter((p) => !withPredictionIds.has(p.user.id))
    .map((p) => ({ userId: p.user.id, name: p.user.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (pending.length === 0) return null;

  return {
    roundName: round.name,
    roundEndDate: round.endDate,
    pending,
  };
}
