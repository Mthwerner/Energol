/**
 * fix-swapped-teams.ts
 *
 * Detecta jogos FINISHED onde o sync inverteu homeTeam/awayTeam e
 * consequentemente trocou homeScore/awayScore — fazendo os palpites
 * dos participantes parecerem errados na exibição.
 *
 * Detecção: jogo FINISHED onde a MAIORIA dos palpites previu o home team
 * ganhando (homeScore > awayScore) mas o resultado atual mostra o AWAY
 * team ganhando (awayScore > homeScore) — fortíssimo sinal de swap.
 *
 * Fix: inverte homeTeam/awayTeam e homeScore/awayScore do jogo.
 * Os palpites não precisam ser alterados — eles ficam corretos na nova ordem.
 *
 * Uso:
 *   npx tsx scripts/fix-swapped-teams.ts --pool "Simple"       # diagnóstico
 *   npx tsx scripts/fix-swapped-teams.ts --pool "Simple" --fix  # aplica
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--fix');
const POOL_FILTER = (() => {
  const idx = process.argv.indexOf('--pool');
  return idx !== -1 ? process.argv[idx + 1] : undefined;
})();

async function main() {
  console.log(DRY_RUN ? '🔍 MODO DIAGNÓSTICO (sem alterações)' : '🔧 MODO FIX — aplicando correções');

  const pools = await prisma.pool.findMany({
    where: POOL_FILTER ? { name: { contains: POOL_FILTER, mode: 'insensitive' } } : undefined,
    select: { id: true, name: true },
  });

  let totalSwapped = 0;
  let totalFixed = 0;

  for (const pool of pools) {
    const games = await prisma.game.findMany({
      where: {
        round: { poolId: pool.id },
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null },
      },
      include: {
        round: { select: { name: true } },
        predictions: { select: { homeScore: true, awayScore: true } },
      },
    });

    for (const game of games) {
      if (game.predictions.length < 3) continue;
      if (game.homeScore === null || game.awayScore === null) continue;

      // Resultado atual
      const resultHomeWins = game.homeScore > game.awayScore;
      const resultDraw     = game.homeScore === game.awayScore;

      // O que a maioria dos palpites previu
      let predsHomeWins = 0, predsAwayWins = 0, predsDraw = 0;
      for (const p of game.predictions) {
        if (p.homeScore > p.awayScore) predsHomeWins++;
        else if (p.homeScore < p.awayScore) predsAwayWins++;
        else predsDraw++;
      }
      const total = game.predictions.length;
      const majorityCheeredHome = predsHomeWins / total > 0.6;
      const majorityCheeredAway = predsAwayWins / total > 0.6;

      // Sinal de swap: maioria previu home ganhar, mas resultado mostra away ganhou (ou vice-versa)
      const likelySwapped =
        (majorityCheeredHome && !resultHomeWins && !resultDraw) ||
        (majorityCheeredAway && resultHomeWins);

      if (!likelySwapped) continue;

      totalSwapped++;
      console.log(`\n[${pool.name}] Rodada: ${game.round.name}`);
      console.log(`  Jogo atual:  ${game.homeTeam} ${game.homeScore} x ${game.awayScore} ${game.awayTeam}`);
      console.log(`  Palpites: home_wins=${predsHomeWins}, away_wins=${predsAwayWins}, draw=${predsDraw} de ${total}`);
      console.log(`  → SWAP DETECTADO: home e away foram invertidos pelo sync`);
      console.log(`  Fix: ${game.awayTeam} ${game.awayScore} x ${game.homeScore} ${game.homeTeam}`);

      if (!DRY_RUN) {
        await prisma.game.update({
          where: { id: game.id },
          data: {
            homeTeam:  game.awayTeam,
            awayTeam:  game.homeTeam,
            homeCrest: game.awayCrest,
            awayCrest: game.homeCrest,
            homeScore: game.awayScore,
            awayScore: game.homeScore,
          },
        });
        console.log(`  ✅ Corrigido`);
        totalFixed++;
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  if (DRY_RUN) {
    console.log(`Jogos com swap detectado: ${totalSwapped}`);
    if (totalSwapped > 0) {
      console.log(`Para corrigir: npx tsx scripts/fix-swapped-teams.ts --pool "Simple" --fix`);
    } else {
      console.log('Nenhum swap detectado.');
    }
  } else {
    console.log(`Corrigidos: ${totalFixed} de ${totalSwapped} jogos`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
