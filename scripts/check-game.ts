/**
 * Mostra os dados completos de um jogo (incluindo predictions) filtrando por times.
 * Uso: npx tsx scripts/check-game.ts "Simple" "norway"
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const poolFilter = process.argv[2] ?? '';
const gameFilter = process.argv[3] ?? '';

async function main() {
  const pools = await prisma.pool.findMany({
    where: poolFilter ? { name: { contains: poolFilter, mode: 'insensitive' } } : undefined,
    select: { id: true, name: true },
  });

  for (const pool of pools) {
    console.log(`\nBolão: ${pool.name}`);

    const games = await prisma.game.findMany({
      where: {
        round: { poolId: pool.id },
        OR: [
          { homeTeam: { contains: gameFilter, mode: 'insensitive' } },
          { awayTeam: { contains: gameFilter, mode: 'insensitive' } },
        ],
      },
      include: {
        round: { select: { name: true, status: true } },
        predictions: {
          include: { user: { select: { name: true } } },
          orderBy: { user: { name: 'asc' } },
        },
      },
      orderBy: { matchDate: 'desc' },
    });

    for (const g of games) {
      console.log(`\n  [Rodada: ${g.round.name}] ${g.homeTeam} x ${g.awayTeam}`);
      console.log(`  externalId: ${g.externalId}  status: ${g.status}  matchDate: ${g.matchDate.toISOString()}`);
      console.log(`  Placar no banco: homeScore=${g.homeScore} awayScore=${g.awayScore}`);
      console.log(`  Palpites (${g.predictions.length}):`);
      for (const p of g.predictions) {
        console.log(`    ${p.user.name}: ${p.homeScore} x ${p.awayScore}  pts=${p.points ?? '?'}  base=${p.basePoints ?? '?'}`);
      }
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
