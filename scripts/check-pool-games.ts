/**
 * check-pool-games.ts
 * Mostra os jogos de hoje e os palpites de cada participante no bolão informado.
 * Uso: npx tsx scripts/check-pool-games.ts "Simple"
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const poolFilter = process.argv[2] ?? '';

async function main() {
  const pools = await prisma.pool.findMany({
    where: poolFilter ? { name: { contains: poolFilter, mode: 'insensitive' } } : undefined,
    select: { id: true, name: true },
  });

  for (const pool of pools) {
    console.log(`\n========================================`);
    console.log(`Bolão: ${pool.name} (${pool.id})`);

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const rounds = await prisma.round.findMany({
      where: { poolId: pool.id },
      include: {
        games: {
          where: { matchDate: { gte: todayStart, lte: todayEnd } },
          include: {
            predictions: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { matchDate: 'asc' },
        },
      },
    });

    const roundsWithGamesToday = rounds.filter((r) => r.games.length > 0);

    if (roundsWithGamesToday.length === 0) {
      console.log('  Nenhum jogo hoje.');
      continue;
    }

    for (const round of roundsWithGamesToday) {
      console.log(`\n  Rodada: ${round.name} (${round.status})`);
      for (const game of round.games) {
        console.log(`\n    ${game.homeTeam} x ${game.awayTeam}`);
        console.log(`    Data: ${game.matchDate.toISOString()}  Status: ${game.status}  externalId: ${game.externalId}`);
        console.log(`    Palpites (${game.predictions.length}):`);
        for (const pred of game.predictions) {
          console.log(`      ${pred.user.name}: ${pred.homeScore} x ${pred.awayScore}  pts=${pred.points ?? '?'}`);
        }
        if (game.predictions.length === 0) {
          console.log('      (nenhum palpite)');
        }
      }
    }

    // Verifica se há jogos de hoje SEM palpites mas com participantes
    const participants = await prisma.participant.count({ where: { poolId: pool.id, isActive: true } });
    console.log(`\n  Total de participantes: ${participants}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
