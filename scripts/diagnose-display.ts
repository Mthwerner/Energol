/**
 * Diagnóstico dos jogos finalizados do Simple Energy:
 * 1) Compara home/away com o template (fonte verdade)
 * 2) Compara pts armazenados vs pts que seriam calculados hoje
 * Não altera nada.
 */
import { PrismaClient } from '@prisma/client';
import { calculateScore } from '../src/domain/scoring';
import { applyWeight } from '../src/domain/knockout-weight';

const prisma = new PrismaClient();

function calcPts(
  pred: { homeScore: number; awayScore: number },
  game: { homeScore: number; awayScore: number },
  pool: Parameters<typeof applyWeight>[1],
  stage: string | null,
) {
  const base = calculateScore(pred, game);
  return applyWeight(base.points, pool, stage);
}

async function main() {
  const pool = await prisma.pool.findFirst({
    where: { name: { contains: 'Simple Energy', mode: 'insensitive' } },
    include: { rounds: { orderBy: { number: 'asc' } } },
  });
  if (!pool) { console.log('Bolão não encontrado'); return; }

  // Buscar jogos do template para comparar home/away
  const templateGames = await prisma.game.findMany({
    where: { round: { poolId: 'pool-copa-mundo-2026' }, externalId: { not: null } },
    select: { externalId: true, homeTeam: true, awayTeam: true },
  });
  const templateMap = new Map(templateGames.map(g => [g.externalId!, g]));

  console.log(`=== Bolão: ${pool.name} ===\n`);

  let totalHomeAwayWrong = 0;
  let totalPtsStale = 0;
  let totalPtsOk = 0;

  for (const round of pool.rounds) {
    const games = await prisma.game.findMany({
      where: { roundId: round.id, status: 'FINISHED', homeScore: { not: null } },
      include: { predictions: { include: { user: { select: { name: true } } } } },
      orderBy: [{ matchDate: 'asc' }, { id: 'asc' }],
    });

    if (games.length === 0) continue;

    console.log(`\n══════════════════════════════════════════`);
    console.log(`${round.name} (${games.length} jogos finalizados)`);
    console.log(`══════════════════════════════════════════`);

    for (const game of games) {
      const tmpl = game.externalId ? templateMap.get(game.externalId) : undefined;
      const homeAwayWrong = tmpl
        ? tmpl.homeTeam.toLowerCase() !== game.homeTeam.toLowerCase()
        : false;

      const dt = game.matchDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

      // Calcula pts corretos para cada prediction
      const staleRows: { user: string; stored: number | null; correct: number }[] = [];
      for (const pred of game.predictions) {
        const { points: correctPts } = calcPts(
          { homeScore: pred.homeScore, awayScore: pred.awayScore },
          { homeScore: game.homeScore!, awayScore: game.awayScore! },
          pool,
          round.stage,
        );
        if (pred.points !== correctPts) {
          staleRows.push({ user: pred.user.name ?? '?', stored: pred.points, correct: correctPts });
          totalPtsStale++;
        } else {
          totalPtsOk++;
        }
      }

      const hasIssue = homeAwayWrong || staleRows.length > 0;
      if (!hasIssue) continue; // mostrar só jogos com problema

      console.log(`\n  ${game.homeTeam} x ${game.awayTeam}  [${dt}]`);
      if (game.homeScore !== null)
        console.log(`  Resultado: ${game.homeScore}x${game.awayScore}`);

      if (homeAwayWrong) {
        totalHomeAwayWrong++;
        console.log(`  ⚠️  HOME/AWAY INVERTIDO vs template:`);
        console.log(`     Simple Energy: ${game.homeTeam} x ${game.awayTeam}`);
        console.log(`     Template:      ${tmpl!.homeTeam} x ${tmpl!.awayTeam}`);
        console.log(`     → Fix: trocar homeTeam↔awayTeam, homeScore↔awayScore E homeScore↔awayScore das predictions`);
      }

      if (staleRows.length > 0) {
        console.log(`  📊 Pontos desatualizados (${staleRows.length} predictions):`);
        for (const r of staleRows) {
          console.log(`     ${r.user.padEnd(25)} armazenado=${r.stored ?? 'null'} → correto=${r.correct}`);
        }
      }
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`RESUMO:`);
  console.log(`  Jogos com home/away invertido vs template: ${totalHomeAwayWrong}`);
  console.log(`  Predictions com pts desatualizados:        ${totalPtsStale}`);
  console.log(`  Predictions com pts corretos:              ${totalPtsOk}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
