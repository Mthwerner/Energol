/**
 * Mostra todos os palpites de um usuário em um bolão, com o jogo correspondente.
 * Uso: npx tsx scripts/check-user-preds.ts "Simple" "Mthwerner"
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const poolFilter = process.argv[2] ?? '';
const userFilter = process.argv[3] ?? '';

async function main() {
  const pools = await prisma.pool.findMany({
    where: poolFilter ? { name: { contains: poolFilter, mode: 'insensitive' } } : undefined,
    select: { id: true, name: true },
  });

  for (const pool of pools) {
    console.log(`\nBolão: ${pool.name}`);

    const predictions = await prisma.prediction.findMany({
      where: {
        user: { name: { contains: userFilter, mode: 'insensitive' } },
        game: { round: { poolId: pool.id } },
      },
      include: {
        game: {
          include: { round: { select: { name: true, number: true } } },
        },
        user: { select: { name: true } },
      },
      orderBy: { game: { matchDate: 'asc' } },
    });

    if (predictions.length === 0) {
      console.log('  Nenhum palpite encontrado.');
      continue;
    }

    console.log(`  Usuário: ${predictions[0].user.name}`);
    console.log(`  Total de palpites: ${predictions.length}\n`);

    let currentRound = '';
    for (const p of predictions) {
      const roundLabel = `Rodada ${p.game.round.number} — ${p.game.round.name}`;
      if (roundLabel !== currentRound) {
        console.log(`  [${roundLabel}]`);
        currentRound = roundLabel;
      }
      const gameId = p.gameId;
      const date = p.game.matchDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const status = p.game.status;
      const result = (p.game.homeScore !== null && p.game.awayScore !== null)
        ? `→ real: ${p.game.homeScore}x${p.game.awayScore}`
        : '→ sem resultado';
      console.log(`    ${p.game.homeTeam} x ${p.game.awayTeam}`);
      console.log(`    Palpite: ${p.homeScore}x${p.awayScore}  pts=${p.points ?? '?'}  ${status}  ${date}`);
      console.log(`    ${result}  gameId=${gameId}`);
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
