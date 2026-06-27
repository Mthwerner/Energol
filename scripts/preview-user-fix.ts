/**
 * Mostra como os palpites de um usuário estão AGORA vs como ficariam APÓS o fix.
 * Apenas leitura — não altera nada.
 */
import { PrismaClient } from '@prisma/client';
import { calculateScore } from '../src/domain/scoring';
import { applyWeight } from '../src/domain/knockout-weight';

const prisma = new PrismaClient();
const USER_FILTER = process.argv[2] ?? 'Mthwerner';
const POOL_FILTER = process.argv[3] ?? 'Simple Energy';

async function main() {
  const pool = await prisma.pool.findFirst({
    where: { name: { contains: POOL_FILTER, mode: 'insensitive' } },
    include: { rounds: { orderBy: { number: 'asc' } } },
  });
  if (!pool) { console.log('Bolão não encontrado'); return; }

  // Template para detectar home/away invertido
  const templateGames = await prisma.game.findMany({
    where: { round: { poolId: 'pool-copa-mundo-2026' }, externalId: { not: null } },
    select: { externalId: true, homeTeam: true, awayTeam: true },
  });
  const templateMap = new Map(templateGames.map(g => [g.externalId!, g]));

  // Predictions do usuário
  const predictions = await prisma.prediction.findMany({
    where: {
      user: { name: { contains: USER_FILTER, mode: 'insensitive' } },
      game: { round: { poolId: pool.id }, status: 'FINISHED', homeScore: { not: null } },
    },
    include: {
      game: { include: { round: { select: { name: true, number: true, stage: true } } } },
      user: { select: { name: true } },
    },
    orderBy: [{ game: { matchDate: 'asc' } }, { game: { id: 'asc' } }],
  });

  if (predictions.length === 0) {
    console.log('Nenhuma prediction encontrada.');
    return;
  }

  const userName = predictions[0].user.name ?? USER_FILTER;
  console.log(`Usuário: ${userName}  |  Bolão: ${pool.name}\n`);
  console.log(`${'─'.repeat(100)}`);
  console.log(`${'Jogo'.padEnd(32)} ${'Palpite'.padEnd(8)} ${'Resultado'.padEnd(10)} ${'Pts atual'.padEnd(10)} ${'Palpite fix'.padEnd(12)} ${'Resultado fix'.padEnd(14)} ${'Pts fix'.padEnd(8)} Status`);
  console.log(`${'─'.repeat(100)}`);

  let totalAtual = 0;
  let totalFix = 0;
  let currentRound = '';
  let roundAtual = 0;
  let roundFix = 0;

  for (const pred of predictions) {
    const game = pred.game;
    const round = game.round;
    const tmpl = game.externalId ? templateMap.get(game.externalId) : undefined;
    const homeAwayInverted = tmpl
      ? tmpl.homeTeam.toLowerCase() !== game.homeTeam.toLowerCase()
      : false;

    // Estado ATUAL
    const predAtual = { homeScore: pred.homeScore, awayScore: pred.awayScore };
    const resultAtual = { homeScore: game.homeScore!, awayScore: game.awayScore! };
    const ptsAtual = pred.points ?? 0;

    // Estado APÓS FIX
    // Se home/away invertido: swap no game E nas predictions
    const predFix = homeAwayInverted
      ? { homeScore: pred.awayScore, awayScore: pred.homeScore }
      : predAtual;
    const resultFix = homeAwayInverted
      ? { homeScore: game.awayScore!, awayScore: game.homeScore! }
      : resultAtual;
    const homeTeamFix = homeAwayInverted ? game.awayTeam : game.homeTeam;
    const awayTeamFix = homeAwayInverted ? game.homeTeam : game.awayTeam;

    const calcFix = calculateScore(predFix, resultFix);
    const { points: ptsFix } = applyWeight(calcFix.points, pool, round.stage);

    // Recalcular pts atual correto (mesmo sem home/away fix, pts pode estar stale)
    const calcCorretoAtual = calculateScore(predAtual, resultAtual);
    const { points: ptsCorretoAtual } = applyWeight(calcCorretoAtual.points, pool, round.stage);

    // Separador de rodada
    const roundLabel = `Rodada ${round.number} — ${round.name}`;
    if (roundLabel !== currentRound) {
      if (currentRound !== '') {
        console.log(`${'─'.repeat(100)}`);
        console.log(`  Subtotal ${currentRound.slice(0,30).padEnd(30)}:  pts atual=${roundAtual}  pts fix=${roundFix}`);
        console.log(`${'─'.repeat(100)}`);
      }
      currentRound = roundLabel;
      console.log(`\n[${roundLabel}]`);
      roundAtual = 0;
      roundFix = 0;
    }

    const jogoAtual = `${game.homeTeam} x ${game.awayTeam}`.slice(0, 30).padEnd(32);
    const jogoFix   = homeAwayInverted ? `${homeTeamFix} x ${awayTeamFix}` : '';

    const predAtualStr = `${pred.homeScore}x${pred.awayScore}`.padEnd(8);
    const resultAtualStr = `${game.homeScore}x${game.awayScore}`.padEnd(10);
    const ptsAtualStr = String(ptsAtual).padEnd(10);
    const predFixStr = homeAwayInverted ? `${predFix.homeScore}x${predFix.awayScore}` : `${pred.homeScore}x${pred.awayScore}`;
    const resultFixStr = homeAwayInverted ? `${resultFix.homeScore}x${resultFix.awayScore}` : `${game.homeScore}x${game.awayScore}`;
    const ptsFixStr = String(ptsFix).padEnd(8);

    const changed = ptsAtual !== ptsFix || homeAwayInverted;
    const status = homeAwayInverted && ptsAtual !== ptsFix
      ? '⚠️ home/away + pts'
      : homeAwayInverted
        ? '⚠️ home/away'
        : ptsAtual !== ptsFix
          ? '📊 pts stale'
          : '✅ ok';

    console.log(`${jogoAtual} ${predAtualStr} ${resultAtualStr} ${ptsAtualStr} ${predFixStr.padEnd(12)} ${resultFixStr.padEnd(14)} ${ptsFixStr} ${status}`);
    if (homeAwayInverted && jogoFix) {
      console.log(`  → jogo correto: ${jogoFix}`);
    }

    totalAtual += ptsAtual;
    totalFix += ptsFix;
    roundAtual += ptsAtual;
    roundFix += ptsFix;
  }

  // Último subtotal
  if (currentRound !== '') {
    console.log(`${'─'.repeat(100)}`);
    console.log(`  Subtotal ${currentRound.slice(0,30).padEnd(30)}:  pts atual=${roundAtual}  pts fix=${roundFix}`);
  }

  console.log(`\n${'═'.repeat(100)}`);
  console.log(`TOTAL ATUAL: ${totalAtual} pts`);
  console.log(`TOTAL APÓS FIX: ${totalFix} pts`);
  console.log(`Diferença: ${totalFix - totalAtual > 0 ? '+' : ''}${totalFix - totalAtual} pts`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
