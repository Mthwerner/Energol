import { prisma } from '@/lib/prisma';
import { GameStatus, RoundStatus } from '@prisma/client';
import { calculateScore } from '@/domain/scoring';

export async function setGameResult(
  gameId: string,
  homeScore: number,
  awayScore: number,
  correctedBy: string,
  reason?: string,
) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { round: true },
  });

  if (!game) throw new Error('Jogo não encontrado');

  return prisma.$transaction(async (tx) => {
    // Log correction if re-correcting
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

    // Update game result
    await tx.game.update({
      where: { id: gameId },
      data: { homeScore, awayScore, status: GameStatus.FINISHED },
    });

    // Recalculate points for all predictions
    const predictions = await tx.prediction.findMany({ where: { gameId } });

    for (const pred of predictions) {
      const calc = calculateScore(
        { homeScore: pred.homeScore, awayScore: pred.awayScore },
        { homeScore, awayScore },
      );
      await tx.prediction.update({
        where: { id: pred.id },
        data: { points: calc.points },
      });
    }

    // Check if all games in round are finished to update round status
    const allGames = await tx.game.findMany({ where: { roundId: game.roundId } });
    const allFinished = allGames.every((g) => g.status === GameStatus.FINISHED || g.id === gameId);

    if (allFinished) {
      await tx.round.update({
        where: { id: game.roundId },
        data: { status: RoundStatus.FINISHED },
      });

      // Recalculate ParticipantScores for the round
      await recalculateRoundScores(tx, game.roundId);
    }
  });
}

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
    const totalPoints = userPreds.reduce((sum, p) => sum + (p.points ?? 0), 0);
    const exactScores = userPreds.filter((p) => p.points === 10).length;
    const correctResults = userPreds.filter((p) => p.points === 5 || p.points === 7).length;

    await tx.participantScore.upsert({
      where: { participantId_roundId: { participantId: participant.id, roundId } },
      update: { totalPoints, exactScores, correctResults },
      create: { participantId: participant.id, roundId, totalPoints, exactScores, correctResults },
    });
  }
}

/**
 * Recalcula pontos das predições e scores dos participantes para uma rodada.
 * Usado pelo sync para garantir consistência mesmo quando jogos são criados
 * já com status FINISHED (sem passar pelo fluxo normal de setGameResult).
 */
export async function recalculateRoundResults(roundId: string): Promise<void> {
  // Recalcula pontos das predições para todos os jogos finalizados
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
      if (pred.points !== calc.points) {
        await prisma.prediction.update({
          where: { id: pred.id },
          data: { points: calc.points },
        });
      }
    }
  }

  // Agrega ParticipantScores com pontos atualizados
  const participants = await prisma.participant.findMany({
    where: { pool: { rounds: { some: { id: roundId } } }, isActive: true },
  });

  const predictions = await prisma.prediction.findMany({
    where: { game: { roundId } },
  });

  for (const participant of participants) {
    const userPreds = predictions.filter((p) => p.userId === participant.userId);
    const totalPoints = userPreds.reduce((sum, p) => sum + (p.points ?? 0), 0);
    const exactScores = userPreds.filter((p) => p.points === 10).length;
    const correctResults = userPreds.filter((p) => p.points === 5 || p.points === 7).length;

    await prisma.participantScore.upsert({
      where: { participantId_roundId: { participantId: participant.id, roundId } },
      update: { totalPoints, exactScores, correctResults },
      create: { participantId: participant.id, roundId, totalPoints, exactScores, correctResults },
    });
  }
}
