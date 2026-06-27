/**
 * Verifica pares de jogos FINALIZADOS com mesmo horário (simultâneos).
 * Para cada par, calcula:
 *  - Pontos atuais (predictions como estão)
 *  - Pontos se trocadas (predictions do jogo A→B e B→A)
 * Indica se o swap melhoraria a pontuação (evidência de dados trocados).
 *
 * Uso:
 *   npx tsx scripts/check-finished-pairs.ts
 *   npx tsx scripts/check-finished-pairs.ts --fix
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--fix');
const POOL_FILTER = (() => {
  const idx = process.argv.indexOf('--pool');
  return idx !== -1 ? process.argv[idx + 1] : 'Simple Energy';
})();

function calcPts(
  predHome: number, predAway: number,
  resultHome: number, resultAway: number,
): number {
  const predResult = predHome > predAway ? 'H' : predHome < predAway ? 'A' : 'D';
  const realResult = resultHome > resultAway ? 'H' : resultHome < resultAway ? 'A' : 'D';
  if (predResult !== realResult) return 0;
  if (predHome === resultHome && predAway === resultAway) return 10;
  return 5;
}

async function swapPredictions(gameIdA: string, gameIdB: string) {
  const [predsA, predsB] = await Promise.all([
    prisma.prediction.findMany({ where: { gameId: gameIdA } }),
    prisma.prediction.findMany({ where: { gameId: gameIdB } }),
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.prediction.deleteMany({ where: { gameId: { in: [gameIdA, gameIdB] } } });
    const toCreate = [
      ...predsA.map(p => ({
        userId: p.userId, gameId: gameIdB,
        homeScore: p.homeScore, awayScore: p.awayScore,
        points: p.points, basePoints: p.basePoints,
      })),
      ...predsB.map(p => ({
        userId: p.userId, gameId: gameIdA,
        homeScore: p.homeScore, awayScore: p.awayScore,
        points: p.points, basePoints: p.basePoints,
      })),
    ];
    await tx.prediction.createMany({ data: toCreate });
  });

  return { movedAtoB: predsA.length, movedBtoA: predsB.length };
}

async function main() {
  console.log(DRY_RUN ? '🔍 DIAGNÓSTICO (sem alterações)' : '🔧 MODO FIX — trocando predictions');
  console.log(`Bolão: ${POOL_FILTER}\n`);

  const pool = await prisma.pool.findFirst({
    where: { name: { contains: POOL_FILTER, mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (!pool) { console.log('Bolão não encontrado.'); return; }

  const games = await prisma.game.findMany({
    where: {
      round: { poolId: pool.id },
      status: 'FINISHED',
      homeScore: { not: null },
    },
    include: {
      predictions: {
        include: { user: { select: { name: true } } },
      },
      round: { select: { name: true, number: true } },
    },
    orderBy: [{ matchDate: 'asc' }, { id: 'asc' }],
  });

  // Agrupar por matchDate exata
  const byDate = new Map<string, typeof games>();
  for (const g of games) {
    const key = g.matchDate.toISOString();
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(g);
  }

  let totalSwapped = 0;

  for (const [date, pair] of byDate) {
    if (pair.length !== 2) continue;

    const [gA, gB] = pair; // ordenados por id ASC (ordem de criação)
    const dt = new Date(date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Ordem alfa: A antes de B alfabeticamente?
    const alphaOrderOk = gA.homeTeam.toLowerCase() < gB.homeTeam.toLowerCase();

    // Calcular pontos atuais e pontos se trocados
    let ptsCurrent = 0, ptsSwapped = 0;
    let wrongCurrent = 0, wrongSwapped = 0;

    const details: string[] = [];

    // Predictions de A vs resultado real de A (atual) ou de B (se trocado)
    for (const pred of gA.predictions) {
      const cur = calcPts(pred.homeScore, pred.awayScore, gA.homeScore!, gA.awayScore!);
      const swp = calcPts(pred.homeScore, pred.awayScore, gB.homeScore!, gB.awayScore!);
      ptsCurrent += cur;
      ptsSwapped += swp;
      if (cur === 0 && swp > 0) wrongCurrent++;
      if (swp === 0 && cur > 0) wrongSwapped++;
      details.push(`    ${pred.user.name.padEnd(20)} | A(${gA.homeTeam.slice(0,10)}) pred ${pred.homeScore}x${pred.awayScore} → cur ${cur}pts, swp ${swp}pts`);
    }

    for (const pred of gB.predictions) {
      const cur = calcPts(pred.homeScore, pred.awayScore, gB.homeScore!, gB.awayScore!);
      const swp = calcPts(pred.homeScore, pred.awayScore, gA.homeScore!, gA.awayScore!);
      ptsCurrent += cur;
      ptsSwapped += swp;
      if (cur === 0 && swp > 0) wrongCurrent++;
      if (swp === 0 && cur > 0) wrongSwapped++;
      details.push(`    ${pred.user.name.padEnd(20)} | B(${gB.homeTeam.slice(0,10)}) pred ${pred.homeScore}x${pred.awayScore} → cur ${cur}pts, swp ${swp}pts`);
    }

    const swapBeneficial = ptsSwapped > ptsCurrent;
    const status = !alphaOrderOk && swapBeneficial
      ? '⚠️  SWAP NECESSÁRIO'
      : !alphaOrderOk
        ? '❓ Ordem trocada mas swap não melhora pts'
        : swapBeneficial
          ? '❓ Swap melhora pts mas ordem alfa OK'
          : '✅ OK';

    console.log(`── ${dt}  [${gA.round.name}] ──────────────────────────`);
    console.log(`  A (${gA.id.slice(-6)}): ${gA.homeTeam} x ${gA.awayTeam}  resultado: ${gA.homeScore}x${gA.awayScore}  preds=${gA.predictions.length}`);
    console.log(`  B (${gB.id.slice(-6)}): ${gB.homeTeam} x ${gB.awayTeam}  resultado: ${gB.homeScore}x${gB.awayScore}  preds=${gB.predictions.length}`);
    console.log(`  Ordem alfa OK: ${alphaOrderOk ? 'SIM' : 'NÃO (A deveria vir depois de B)'}`);
    console.log(`  Pts ATUAL: ${ptsCurrent}  |  Pts SE TROCADO: ${ptsSwapped}  |  Diferença: ${ptsSwapped - ptsCurrent}`);
    console.log(`  ${status}`);

    if (details.length > 0 && (!alphaOrderOk || swapBeneficial)) {
      console.log('  Detalhes por participante:');
      for (const d of details) console.log(d);
    }

    if (!DRY_RUN && !alphaOrderOk && swapBeneficial) {
      const result = await swapPredictions(gA.id, gB.id);
      console.log(`  ✅ Trocados: ${result.movedAtoB} A→B, ${result.movedBtoA} B→A`);
      totalSwapped++;
    }

    console.log();
  }

  if (DRY_RUN) {
    console.log('Para aplicar os swaps detectados:');
    console.log('  npx tsx scripts/check-finished-pairs.ts --fix');
    console.log('  npx tsx scripts/check-finished-pairs.ts --pool "Kaisermigos" --fix');
  } else {
    console.log(`Total de pares corrigidos: ${totalSwapped}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
