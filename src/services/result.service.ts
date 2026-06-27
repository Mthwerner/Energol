import { prisma } from '@/lib/prisma';
import { GameStatus, RoundStatus } from '@prisma/client';
import { calculateScore } from '@/domain/scoring';
import { applyWeight } from '@/domain/knockout-weight';

export async function setGameResult(
  gameId: string,
  homeScore: number,
  awayScore: number,
  correctedBy: string,
  reason?: string,
) {
  // Inclui round → pool para ter o config de peso da fase eliminatória.
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { round: { include: { pool: true } } },
  });

  if (!game) throw new Error('Jogo não encontrado');

  return prisma.$transaction(async (tx) => {
    // Log de correção se o jogo já estava finalizado
    if (game.status === GameStatus.FINISHED) {
      await tx.resultCorrectionLog.create({
        data: {
          gameId,
          correctedBy,
          oldHome: game.homeScore,
          oldAway: game.awayScore,
          newHome: homeScore,
          newAway: awayScore,
          reason,
        },
      });
    }

    await tx.game.update({
      where: { id: gameId },
      data: { homeScore, awayScore, status: GameStatus.FINISHED },
    });

    // Recalcula pontos de todas as predições aplicando o multiplicador de fase.
    const predictions = await tx.prediction.findMany({ where: { gameId } });

    for (const pred of predictions) {
      const calc = calculateScore(
        { homeScore: pred.homeScore, awayScore: pred.awayScore },
        { homeScore, awayScore },
      );
      // applyWeight retorna { basePoints, points } — basePoints para contadores de tier,
      // points para o total da rodada (já multiplicado pela fase, se habilitado).
      const weighted = applyWeight(calc.points, game.round.pool, game.round.stage);
      await tx.prediction.update({
        where: { id: pred.id },
        data: weighted,
      });
    }

    const allGames = await tx.game.findMany({ where: { roundId: game.roundId } });
    const allFinished = allGames.every(
      (g) => g.status === GameStatus.FINISHED || g.id === gameId,
    );

    if (allFinished) {
      await tx.round.update({
        where: { id: game.roundId },
        data: { status: RoundStatus.FINISHED },
      });

      await recalculateRoundScores(tx, game.roundId);
    }
  }, { timeout: 30000 });
}

/**
 * Agrega ParticipantScore para uma rodada a partir das predições já salvas.
 *
 * Os contadores de tier (exactScores, correctResults) usam basePoints para serem
 * imunes ao multiplicador de fase: um placar exato vale 10 pontos-base independente
 * de a fase ser 2× ou 6×. Quando basePoints é null (predições antigas sem o campo),
 * cai back para points — seguro pois essas predições nunca tiveram peso aplicado.
 */
async function recalculateRoundScores(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  roundId: string,
) {
  const participants = await tx.participant.findMany({
    where: { pool: { rounds: { some: { id: roundId } } }, isActive: true },
  });

  const predictions = await tx.prediction.findMany({
    where: { game: { roundId } },
  });

  for (const participant of participants) {
    const userPreds = predictions.filter((p) => p.userId === participant.userId);

    // totalPoints soma os pontos já ponderados pelo multiplicador de fase
    const totalPoints = userPreds.reduce((sum, p) => sum + (p.points ?? 0), 0);

    // Contadores de categoria usam a pontuação-BASE (sem multiplicador de fase)
    const exactScores = userPreds.filter((p) => (p.basePoints ?? p.points) === 10).length;
    const correctResults = userPreds.filter((p) => {
      const base = p.basePoints ?? p.points;
      return base === 5 || base === 7;
    }).length;

    await tx.participantScore.upsert({
      where: { participantId_roundId: { participantId: participant.id, roundId } },
      update: { totalPoints, exactScores, correctResults },
      create: { participantId: participant.id, roundId, totalPoints, exactScores, correctResults },
    });
  }
}

/**
 * Recalcula pontos das predições e scores dos participantes para uma rodada.
 * Usado pelo sync para garantir consistência mesmo quando jogos chegam já FINISHED.
 *
 * Também aplica o multiplicador de fase (se habilitado no bolão), garantindo que
 * qualquer caminho de recálculo produza exatamente o mesmo resultado.
 */
export async function recalculateRoundResults(roundId: string): Promise<void> {
  // Carrega round com pool para ter config de peso e stage da rodada
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { pool: true },
  });
  if (!round) return;

  const games = await prisma.game.findMany({
    where: { roundId, status: GameStatus.FINISHED },
    include: { predictions: true },
  });

  for (const game of games) {
    if (game.homeScore === null || game.awayScore === null) continue;
    for (const pred of game.predictions) {
      const calc = calculateScore(
        { homeScore: pred.homeScore, awayScore: pred.awayScore },
        { homeScore: game.homeScore, awayScore: game.awayScore },
      );
      const weighted = applyWeight(calc.points, round.pool, round.stage);
      // Só escreve se mudou, para evitar writes desnecessários
      if (pred.basePoints !== weighted.basePoints || pred.points !== weighted.points) {
        await prisma.prediction.update({
          where: { id: pred.id },
          data: weighted,
        });
      }
    }
  }

  // Agrega ParticipantScores com predições atualizadas
  const participants = await prisma.participant.findMany({
    where: { pool: { rounds: { some: { id: roundId } } }, isActive: true },
  });

  const predictions = await prisma.prediction.findMany({
    where: { game: { roundId } },
  });

  for (const participant of participants) {
    const userPreds = predictions.filter((p) => p.userId === participant.userId);
    const totalPoints = userPreds.reduce((sum, p) => sum + (p.points ?? 0), 0);
    const exactScores = userPreds.filter((p) => (p.basePoints ?? p.points) === 10).length;
    const correctResults = userPreds.filter((p) => {
      const base = p.basePoints ?? p.points;
      return base === 5 || base === 7;
    }).length;

    await prisma.participantScore.upsert({
      where: { participantId_roundId: { participantId: participant.id, roundId } },
      update: { totalPoints, exactScores, correctResults },
      create: { participantId: participant.id, roundId, totalPoints, exactScores, correctResults },
    });
  }
}
