/**
 * Compara a ordem dos jogos SCHEDULED entre o bolão clonado e o template,
 * detectando inversões de home/away que não puderam ser detectadas pela
 * heurística de votos (só funciona em jogos finalizados).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const poolFilter = process.argv[2] ?? 'Simple';
const TEMPLATE_POOL_ID = 'pool-copa-mundo-2026';

async function main() {
  const pool = await prisma.pool.findFirst({
    where: { name: { contains: poolFilter, mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (!pool) { console.log('Bolão não encontrado'); return; }

  console.log(`Comparando "${pool.name}" com template...\n`);

  // Busca jogos SCHEDULED com externalId em ambos os bolões
  const cloneGames = await prisma.game.findMany({
    where: {
      round: { poolId: pool.id },
      status: { not: 'FINISHED' },
      externalId: { not: null },
    },
    select: { id: true, externalId: true, homeTeam: true, awayTeam: true, matchDate: true, status: true },
    orderBy: { matchDate: 'asc' },
  });

  const templateGames = await prisma.game.findMany({
    where: {
      round: { poolId: TEMPLATE_POOL_ID },
      externalId: { in: cloneGames.map(g => g.externalId!).filter(Boolean) },
    },
    select: { externalId: true, homeTeam: true, awayTeam: true },
  });

  const templateMap = new Map(templateGames.map(g => [g.externalId!, g]));

  let swapped = 0;
  for (const g of cloneGames) {
    const t = templateMap.get(g.externalId!);
    if (!t) continue;

    const homeMatch = g.homeTeam.toLowerCase() === t.homeTeam.toLowerCase();
    const awayMatch = g.awayTeam.toLowerCase() === t.awayTeam.toLowerCase();
    const homeIsAway = g.homeTeam.toLowerCase() === t.awayTeam.toLowerCase();
    const awayIsHome = g.awayTeam.toLowerCase() === t.homeTeam.toLowerCase();

    if (!homeMatch && homeIsAway && awayIsHome) {
      swapped++;
      const date = g.matchDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      console.log(`⚠️  INVERTIDO  externalId=${g.externalId}  ${date}`);
      console.log(`   Clone:    ${g.homeTeam} x ${g.awayTeam}`);
      console.log(`   Template: ${t.homeTeam} x ${t.awayTeam}`);
    }
  }

  if (swapped === 0) {
    console.log('✅ Nenhum jogo futuro com times invertidos.');
  } else {
    console.log(`\nTotal: ${swapped} jogos com inversão detectada.`);
  }

  // Também mostra os palpites do Mthwerner nos jogos futuros
  console.log('\n── Palpites de Mthwerner nos jogos futuros ──');
  const preds = await prisma.prediction.findMany({
    where: {
      user: { name: { contains: 'Mthwerner', mode: 'insensitive' } },
      game: {
        round: { poolId: pool.id },
        status: { not: 'FINISHED' },
      },
    },
    include: {
      game: { include: { round: { select: { name: true } } } },
    },
    orderBy: { game: { matchDate: 'asc' } },
  });

  for (const p of preds) {
    const date = p.game.matchDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const t = templateMap.get(p.game.externalId ?? -1);
    const swapFlag = t && p.game.homeTeam.toLowerCase() === t.awayTeam.toLowerCase() ? ' ⚠️ INVERTIDO' : '';
    console.log(`  ${p.game.homeTeam} x ${p.game.awayTeam}  →  palpite ${p.homeScore}x${p.awayScore}  [${date}]${swapFlag}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
