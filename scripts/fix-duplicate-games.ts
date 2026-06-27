/**
 * fix-duplicate-games.ts
 *
 * Diagnóstica e corrige jogos duplicados criados quando o sync pool-scoped
 * encontrou games com externalId:null (clonados sem externalId) e não bateu
 * no fallback por matchDate — resultando em novos games com externalId mas
 * sem predictions.
 *
 * O fix:
 *   1. Acha pares (jogo antigo externalId:null + jogo novo externalId:X) com
 *      mesma roundId e matchDate (ou mesmo homeTeam+awayTeam).
 *   2. Copia o externalId do novo para o antigo.
 *   3. Move qualquer prediction do novo para o antigo (upsert).
 *   4. Deleta o novo (agora redundante).
 *
 * Uso:
 *   npx tsx scripts/fix-duplicate-games.ts           # diagnóstico
 *   npx tsx scripts/fix-duplicate-games.ts --fix     # aplica correção
 *   npx tsx scripts/fix-duplicate-games.ts --pool "Simple" --fix
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
  if (POOL_FILTER) console.log(`   Filtrando por bolão: "${POOL_FILTER}"`);

  const pools = await prisma.pool.findMany({
    where: POOL_FILTER ? { name: { contains: POOL_FILTER, mode: 'insensitive' } } : undefined,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  if (pools.length === 0) {
    console.log('Nenhum bolão encontrado.');
    return;
  }

  let totalDuplicates = 0;
  let totalFixed = 0;

  for (const pool of pools) {
    const rounds = await prisma.round.findMany({
      where: { poolId: pool.id },
      select: { id: true, name: true },
    });

    for (const round of rounds) {
      const games = await prisma.game.findMany({
        where: { roundId: round.id },
        select: {
          id: true,
          externalId: true,
          homeTeam: true,
          awayTeam: true,
          matchDate: true,
          status: true,
          _count: { select: { predictions: true } },
        },
        orderBy: { matchDate: 'asc' },
      });

      // Detectar duplicatas: jogos com mesmo (homeTeam, awayTeam) ou mesma matchDate
      // Um tem externalId:null (antigo, com predictions) e outro tem externalId:X (novo, sem predictions)
      const nullGames = games.filter((g) => g.externalId === null);
      const externalGames = games.filter((g) => g.externalId !== null);

      for (const nullGame of nullGames) {
        // Tenta casar por matchDate exata ou por homeTeam+awayTeam (para absorver diferença de horário)
        const match =
          externalGames.find((eg) => eg.matchDate.getTime() === nullGame.matchDate.getTime()) ??
          externalGames.find(
            (eg) =>
              eg.homeTeam === nullGame.homeTeam &&
              eg.awayTeam === nullGame.awayTeam,
          );

        if (!match) continue;

        totalDuplicates++;
        const predCount = nullGame._count.predictions;
        const newPredCount = match._count.predictions;

        console.log(`\n[${pool.name}] Rodada: ${round.name}`);
        console.log(`  ANTIGO  id=${nullGame.id} externalId=null  predictions=${predCount}  ${nullGame.homeTeam} x ${nullGame.awayTeam}  ${nullGame.matchDate.toISOString()}`);
        console.log(`  NOVO    id=${match.id} externalId=${match.externalId} predictions=${newPredCount}  ${match.homeTeam} x ${match.awayTeam}  ${match.matchDate.toISOString()}`);
        console.log(`  Ação: copiar externalId → antigo, mover ${newPredCount} predictions (se houver), deletar novo`);

        if (!DRY_RUN) {
          // Move predictions do novo → antigo (não deve haver, mas por segurança)
          if (newPredCount > 0) {
            const newPreds = await prisma.prediction.findMany({
              where: { gameId: match.id },
            });
            for (const pred of newPreds) {
              await prisma.prediction.upsert({
                where: { userId_gameId: { userId: pred.userId, gameId: nullGame.id } },
                update: { homeScore: pred.homeScore, awayScore: pred.awayScore, points: pred.points, basePoints: pred.basePoints },
                create: {
                  userId: pred.userId,
                  gameId: nullGame.id,
                  homeScore: pred.homeScore,
                  awayScore: pred.awayScore,
                  points: pred.points,
                  basePoints: pred.basePoints,
                },
              });
            }
            await prisma.prediction.deleteMany({ where: { gameId: match.id } });
          }

          // Deleta o novo jogo
          await prisma.game.delete({ where: { id: match.id } });

          // Seta o externalId no jogo antigo + atualiza dados vindos da API (do novo jogo)
          const newGameFull = await prisma.game.findUnique({ where: { id: match.id } }).catch(() => null);
          // (já deletado, então usamos os dados que temos em memória do match)
          await prisma.game.update({
            where: { id: nullGame.id },
            data: {
              externalId: match.externalId,
              homeTeam: match.homeTeam !== 'A definir' ? match.homeTeam : undefined,
              awayTeam: match.awayTeam !== 'A definir' ? match.awayTeam : undefined,
              matchDate: match.matchDate,
              status: match.status,
            },
          });

          console.log(`  ✅ Corrigido`);
          totalFixed++;
        }
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  if (DRY_RUN) {
    console.log(`Total de duplicatas encontradas: ${totalDuplicates}`);
    if (totalDuplicates > 0) {
      console.log(`Para corrigir, rode: npx tsx scripts/fix-duplicate-games.ts --fix`);
      console.log(`Para só o Simple:    npx tsx scripts/fix-duplicate-games.ts --pool "Simple" --fix`);
    } else {
      console.log('Nenhuma duplicata encontrada. Nada a corrigir.');
    }
  } else {
    console.log(`Corrigidos: ${totalFixed} de ${totalDuplicates} duplicatas`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
