/**
 * fix-swapped-predictions.ts
 *
 * Detecta jogos SCHEDULED que têm o mesmo matchDate (simultâneos) e cujas
 * predictions parecem estar trocadas entre si — causado pelo sync alterar
 * matchDates e inverter a ordem de exibição no formulário quando o prazo
 * já havia encerrado.
 *
 * Estratégia de detecção: compara a ordem dos jogos pelo gameId (ordem de
 * criação = ordem original do clone/seed) com a ordem pelo homeTeam
 * alfabético. Se as duas ordens discordam E o sync atualizou o matchDate
 * para o mesmo valor em ambos, é sinal de que a ordem mudou após as
 * predictions serem salvas.
 *
 * O script exibe os pares detectados e, com --fix, troca as predictions
 * de todos os participantes entre os dois jogos de cada par.
 *
 * Uso:
 *   npx tsx scripts/fix-swapped-predictions.ts --pool "Simple"
 *   npx tsx scripts/fix-swapped-predictions.ts --pool "Simple" --fix
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--fix');
const POOL_FILTER = (() => {
  const idx = process.argv.indexOf('--pool');
  return idx !== -1 ? process.argv[idx + 1] : undefined;
})();

async function swapPredictions(gameIdA: string, gameIdB: string) {
  const [predsA, predsB] = await Promise.all([
    prisma.prediction.findMany({ where: { gameId: gameIdA } }),
    prisma.prediction.findMany({ where: { gameId: gameIdB } }),
  ]);

  await prisma.$transaction(async (tx) => {
    // Deleta as predictions dos dois jogos
    await tx.prediction.deleteMany({ where: { gameId: { in: [gameIdA, gameIdB] } } });

    // Recria: A→B e B→A
    const toCreate = [
      ...predsA.map(p => ({ userId: p.userId, gameId: gameIdB, homeScore: p.homeScore, awayScore: p.awayScore, points: p.points, basePoints: p.basePoints })),
      ...predsB.map(p => ({ userId: p.userId, gameId: gameIdA, homeScore: p.homeScore, awayScore: p.awayScore, points: p.points, basePoints: p.basePoints })),
    ];
    await tx.prediction.createMany({ data: toCreate });
  });

  return { movedAtoB: predsA.length, movedBtoA: predsB.length };
}

async function main() {
  console.log(DRY_RUN ? '🔍 MODO DIAGNÓSTICO (sem alterações)' : '🔧 MODO FIX — trocando predictions');

  const pools = await prisma.pool.findMany({
    where: POOL_FILTER ? { name: { contains: POOL_FILTER, mode: 'insensitive' } } : undefined,
    select: { id: true, name: true },
  });

  for (const pool of pools) {
    console.log(`\n[${pool.name}]`);

    // Busca todos os jogos não finalizados, agrupando por matchDate
    const games = await prisma.game.findMany({
      where: { round: { poolId: pool.id }, status: { not: 'FINISHED' } },
      select: {
        id: true, homeTeam: true, awayTeam: true, matchDate: true, externalId: true,
        _count: { select: { predictions: true } },
      },
      orderBy: [{ matchDate: 'asc' }, { id: 'asc' }],
    });

    // Agrupa por matchDate exata
    const byDate = new Map<string, typeof games>();
    for (const g of games) {
      const key = g.matchDate.toISOString();
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(g);
    }

    // Só nos interessa pares (exatamente 2 jogos no mesmo horário)
    for (const [date, pair] of byDate) {
      if (pair.length !== 2) continue;

      const [gA, gB] = pair; // ordem atual: por gameId asc (ordem de criação)

      // Ordem que o sync/API geraria (homeTeam alfabético)
      const alphA = gA.homeTeam.toLowerCase() < gB.homeTeam.toLowerCase() ? gA : gB;
      const alphB = alphA === gA ? gB : gA;

      // Se a ordem por gameId (original) == ordem alfabética → sem swap
      // Se a ordem por gameId != ordem alfabética → indica que o sync
      // apresentou na ordem oposta, causando o problema
      const creationOrderMatchesAlpha = gA === alphA;

      if (creationOrderMatchesAlpha) {
        // Sem swap detectado
        continue;
      }

      // Confirma que há predictions nos dois jogos (se houvesse swap)
      const totalPreds = gA._count.predictions + gB._count.predictions;
      if (totalPreds === 0) continue;

      const dt = new Date(date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      console.log(`\n  Par simultâneo em ${dt}:`);
      console.log(`    A (id_ordem=${gA.id.slice(-6)}): ${gA.homeTeam} x ${gA.awayTeam}  palpites=${gA._count.predictions}`);
      console.log(`    B (id_ordem=${gB.id.slice(-6)}): ${gB.homeTeam} x ${gB.awayTeam}  palpites=${gB._count.predictions}`);
      console.log(`    → Ordem atual (gameId) ≠ ordem que sync apresentou (alfa) — predictions trocadas`);
      console.log(`    → Fix: trocar predictions de A↔B`);

      if (!DRY_RUN) {
        const result = await swapPredictions(gA.id, gB.id);
        console.log(`    ✅ Trocados: ${result.movedAtoB} de A→B, ${result.movedBtoA} de B→A`);
      }
    }
  }

  if (DRY_RUN) {
    console.log('\nPara aplicar: npx tsx scripts/fix-swapped-predictions.ts --pool "Simple" --fix');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
