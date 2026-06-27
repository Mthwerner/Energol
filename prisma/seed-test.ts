/**
 * Seed – Bolão de Teste para Verificação de Pontuação e Classificação
 *
 * Uso:
 *   npx tsx prisma/seed-test.ts
 *
 * Cria um bolão isolado com palpites pré-definidos. Basta registrar os
 * resultados dos jogos pelo painel de admin e confirmar que a pontuação
 * bate com os valores esperados abaixo.
 *
 * ─── CENÁRIO ESPERADO PARA RODADA 1 ────────────────────────────────────────
 *
 *  Jogo 1: Brasil 2 x 1 Argentina
 *  ┌────────────┬──────────┬───────────────┬────────┐
 *  │ Participante│ Palpite  │ Resultado     │ Pontos │
 *  ├────────────┼──────────┼───────────────┼────────┤
 *  │ Mthwerner  │  2 x 1   │ PLACAR EXATO  │  +10   │
 *  │ Carlos     │  1 x 0   │ RESULTADO OK  │   +5   │
 *  │ Marina     │  0 x 0   │ ERROU         │    0   │
 *  │ Pedro      │  2 x 1   │ PLACAR EXATO  │  +10   │
 *  └────────────┴──────────┴───────────────┴────────┘
 *
 *  Jogo 2: França 1 x 1 Alemanha
 *  ┌────────────┬──────────┬───────────────┬────────┐
 *  │ Participante│ Palpite  │ Resultado     │ Pontos │
 *  ├────────────┼──────────┼───────────────┼────────┤
 *  │ Mthwerner  │  0 x 0   │ RESULTADO OK  │   +5   │
 *  │ Carlos     │  1 x 1   │ PLACAR EXATO  │  +10   │
 *  │ Marina     │  2 x 0   │ ERROU         │    0   │
 *  │ Pedro      │  0 x 2   │ ERROU         │    0   │
 *  └────────────┴──────────┴───────────────┴────────┘
 *
 *  Jogo 3: Espanha 1 x 0 Portugal
 *  ┌────────────┬──────────┬───────────────┬────────┐
 *  │ Participante│ Palpite  │ Resultado     │ Pontos │
 *  ├────────────┼──────────┼───────────────┼────────┤
 *  │ Mthwerner  │ sem palpite              │    0   │
 *  │ Carlos     │  1 x 0   │ PLACAR EXATO  │  +10   │
 *  │ Marina     │  2 x 1   │ RESULTADO OK  │   +5   │
 *  │ Pedro      │ sem palpite              │    0   │
 *  └────────────┴──────────┴───────────────┴────────┘
 *
 *  TOTAIS RODADA 1 (classificação esperada):
 *  ┌────┬────────────┬────────┬────────┬─────────┐
 *  │ Pos│ Participante│ Exatos │ Result.│  Pontos │
 *  ├────┼────────────┼────────┼────────┼─────────┤
 *  │  1 │ Carlos     │   3    │   1    │   25    │
 *  │  2 │ Mthwerner  │   1    │   1    │   15    │
 *  │  3 │ Pedro      │   1    │   0    │   10    │
 *  │  4 │ Marina     │   0    │   1    │    5    │
 *  └────┴────────────┴────────┴────────┴─────────┘
 *
 * ─── CENÁRIO ESPERADO PARA RODADA 2 ────────────────────────────────────────
 *
 *  Jogo 4: Inglaterra 0 x 0 Itália
 *  ┌────────────┬──────────┬───────────────┬────────┐
 *  │ Participante│ Palpite  │ Resultado     │ Pontos │
 *  ├────────────┼──────────┼───────────────┼────────┤
 *  │ Mthwerner  │  0 x 0   │ PLACAR EXATO  │  +10   │
 *  │ Carlos     │  1 x 0   │ ERROU         │    0   │
 *  │ Marina     │  1 x 1   │ RESULTADO OK  │   +5   │
 *  │ Pedro      │  2 x 2   │ RESULTADO OK  │   +5   │
 *  └────────────┴──────────┴───────────────┴────────┘
 *
 *  Jogo 5: EUA 2 x 1 México
 *  ┌────────────┬──────────┬───────────────┬────────┐
 *  │ Participante│ Palpite  │ Resultado     │ Pontos │
 *  ├────────────┼──────────┼───────────────┼────────┤
 *  │ Mthwerner  │  1 x 0   │ RESULTADO OK  │   +5   │
 *  │ Carlos     │  2 x 1   │ PLACAR EXATO  │  +10   │
 *  │ Marina     │  0 x 1   │ ERROU         │    0   │
 *  │ Pedro      │  3 x 0   │ RESULTADO OK  │   +5   │
 *  └────────────┴──────────┴───────────────┴────────┘
 *
 *  TOTAIS RODADA 2 (classificação esperada):
 *  ┌────┬────────────┬────────┬────────┬─────────┐
 *  │ Pos│ Participante│ Exatos │ Result.│  Pontos │
 *  ├────┼────────────┼────────┼────────┼─────────┤
 *  │  1 │ Mthwerner  │   1    │   1    │   15    │
 *  │  1 │ Carlos     │   1    │   0    │   10    │
 *  │  3 │ Pedro      │   0    │   2    │   10    │  <- desempate: Carlos tem +exatos
 *  │  4 │ Marina     │   0    │   1    │    5    │
 *  └────┴────────────┴────────┴────────┴─────────┘
 *
 *  TOTAIS GERAIS (após as 2 rodadas):
 *  ┌────┬────────────┬────────┬────────┬─────────┐
 *  │ Pos│ Participante│ Exatos │ Result.│  Pontos │
 *  ├────┼────────────┼────────┼────────┼─────────┤
 *  │  1 │ Carlos     │   4    │   1    │   35    │
 *  │  2 │ Mthwerner  │   2    │   2    │   30    │
 *  │  3 │ Pedro      │   1    │   2    │   20    │
 *  │  4 │ Marina     │   0    │   2    │   10    │
 *  └────┴────────────┴────────┴────────┴─────────┘
 */

import { PrismaClient, GameStatus, RoundStatus } from '@prisma/client';

const prisma = new PrismaClient();

const POOL_ID   = 'pool-teste-pontuacao';
const ROUND1_ID = 'round-teste-r1';
const ROUND2_ID = 'round-teste-r2';

// IDs altos para não colidir com dados reais da Copa 2026
const GAME_IDS = {
  g1: 99001, // Brasil vs Argentina
  g2: 99002, // França vs Alemanha
  g3: 99003, // Espanha vs Portugal
  g4: 99004, // Inglaterra vs Itália
  g5: 99005, // EUA vs México
};

async function main() {
  console.log('🧪 Criando bolão de teste...\n');

  // ── Buscar usuários ──────────────────────────────────────────────────────
  const [admin, carlos, marina, pedro] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: 'matheus@energol.com' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'carlos@energol.com' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'marina@energol.com' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'pedro@energol.com' } }),
  ]);

  const allUsers = [admin, carlos, marina, pedro];

  // ── Pool ──────────────────────────────────────────────────────────────────
  await prisma.pool.upsert({
    where: { id: POOL_ID },
    update: {},
    create: {
      id: POOL_ID,
      name: '🧪 Teste – Verificação de Pontuação',
      description: 'Bolão criado para testar cálculo de pontos e classificação',
      ownerId: admin.id,
    },
  });

  // ── Participantes ─────────────────────────────────────────────────────────
  for (const user of allUsers) {
    await prisma.participant.upsert({
      where: { userId_poolId: { userId: user.id, poolId: POOL_ID } },
      update: { isActive: true },
      create: { userId: user.id, poolId: POOL_ID },
    });
  }

  console.log('✅ Pool e participantes criados\n');

  // ── Rodada 1 ──────────────────────────────────────────────────────────────
  await prisma.round.upsert({
    where: { id: ROUND1_ID },
    update: {},
    create: {
      id: ROUND1_ID,
      poolId: POOL_ID,
      number: 1,
      name: 'Rodada 1 – Fase de Grupos',
      startDate: new Date('2027-06-01T00:00:00Z'),
      endDate: new Date('2027-06-05T23:59:00Z'),
      status: RoundStatus.OPEN,
    },
  });

  const [g1, g2, g3] = await Promise.all([
    prisma.game.findFirst({ where: { externalId: GAME_IDS.g1, roundId: ROUND1_ID } }).then((g) =>
      g ?? prisma.game.create({ data: { roundId: ROUND1_ID, homeTeam: 'Brasil', awayTeam: 'Argentina', matchDate: new Date('2027-06-02T15:00:00Z'), status: GameStatus.SCHEDULED, externalId: GAME_IDS.g1 } }),
    ),
    prisma.game.findFirst({ where: { externalId: GAME_IDS.g2, roundId: ROUND1_ID } }).then((g) =>
      g ?? prisma.game.create({ data: { roundId: ROUND1_ID, homeTeam: 'França', awayTeam: 'Alemanha', matchDate: new Date('2027-06-03T18:00:00Z'), status: GameStatus.SCHEDULED, externalId: GAME_IDS.g2 } }),
    ),
    prisma.game.findFirst({ where: { externalId: GAME_IDS.g3, roundId: ROUND1_ID } }).then((g) =>
      g ?? prisma.game.create({ data: { roundId: ROUND1_ID, homeTeam: 'Espanha', awayTeam: 'Portugal', matchDate: new Date('2027-06-04T21:00:00Z'), status: GameStatus.SCHEDULED, externalId: GAME_IDS.g3 } }),
    ),
  ]);

  console.log('✅ Rodada 1 e jogos criados');

  // ── Rodada 2 ──────────────────────────────────────────────────────────────
  await prisma.round.upsert({
    where: { id: ROUND2_ID },
    update: {},
    create: {
      id: ROUND2_ID,
      poolId: POOL_ID,
      number: 2,
      name: 'Rodada 2 – Oitavas de Final',
      startDate: new Date('2027-06-10T00:00:00Z'),
      endDate: new Date('2027-06-12T23:59:00Z'),
      status: RoundStatus.OPEN,
    },
  });

  const [g4, g5] = await Promise.all([
    prisma.game.findFirst({ where: { externalId: GAME_IDS.g4, roundId: ROUND2_ID } }).then((g) =>
      g ?? prisma.game.create({ data: { roundId: ROUND2_ID, homeTeam: 'Inglaterra', awayTeam: 'Itália', matchDate: new Date('2027-06-10T15:00:00Z'), status: GameStatus.SCHEDULED, externalId: GAME_IDS.g4 } }),
    ),
    prisma.game.findFirst({ where: { externalId: GAME_IDS.g5, roundId: ROUND2_ID } }).then((g) =>
      g ?? prisma.game.create({ data: { roundId: ROUND2_ID, homeTeam: 'EUA', awayTeam: 'México', matchDate: new Date('2027-06-11T18:00:00Z'), status: GameStatus.SCHEDULED, externalId: GAME_IDS.g5 } }),
    ),
  ]);

  console.log('✅ Rodada 2 e jogos criados\n');

  // ── Palpites pré-definidos ─────────────────────────────────────────────────
  // Rodada 1
  const preds = [
    // Jogo 1: Brasil vs Argentina  (resultado real: 2x1)
    { userId: admin.id,  gameId: g1.id, homeScore: 2, awayScore: 1 }, // EXATO   +10
    { userId: carlos.id, gameId: g1.id, homeScore: 1, awayScore: 0 }, // RESULT  +5
    { userId: marina.id, gameId: g1.id, homeScore: 0, awayScore: 0 }, // ERROU   0
    { userId: pedro.id,  gameId: g1.id, homeScore: 2, awayScore: 1 }, // EXATO   +10
    // Jogo 2: França vs Alemanha  (resultado real: 1x1)
    { userId: admin.id,  gameId: g2.id, homeScore: 0, awayScore: 0 }, // RESULT  +5
    { userId: carlos.id, gameId: g2.id, homeScore: 1, awayScore: 1 }, // EXATO   +10
    { userId: marina.id, gameId: g2.id, homeScore: 2, awayScore: 0 }, // ERROU   0
    { userId: pedro.id,  gameId: g2.id, homeScore: 0, awayScore: 2 }, // ERROU   0
    // Jogo 3: Espanha vs Portugal  (resultado real: 1x0)
    // admin e pedro sem palpite
    { userId: carlos.id, gameId: g3.id, homeScore: 1, awayScore: 0 }, // EXATO   +10
    { userId: marina.id, gameId: g3.id, homeScore: 2, awayScore: 1 }, // RESULT  +5
    // Rodada 2
    // Jogo 4: Inglaterra vs Itália  (resultado real: 0x0)
    { userId: admin.id,  gameId: g4.id, homeScore: 0, awayScore: 0 }, // EXATO   +10
    { userId: carlos.id, gameId: g4.id, homeScore: 1, awayScore: 0 }, // ERROU   0
    { userId: marina.id, gameId: g4.id, homeScore: 1, awayScore: 1 }, // RESULT  +5
    { userId: pedro.id,  gameId: g4.id, homeScore: 2, awayScore: 2 }, // RESULT  +5
    // Jogo 5: EUA vs México  (resultado real: 2x1)
    { userId: admin.id,  gameId: g5.id, homeScore: 1, awayScore: 0 }, // RESULT  +5
    { userId: carlos.id, gameId: g5.id, homeScore: 2, awayScore: 1 }, // EXATO   +10
    { userId: marina.id, gameId: g5.id, homeScore: 0, awayScore: 1 }, // ERROU   0
    { userId: pedro.id,  gameId: g5.id, homeScore: 3, awayScore: 0 }, // RESULT  +5
  ];

  for (const p of preds) {
    await prisma.prediction.upsert({
      where: { userId_gameId: { userId: p.userId, gameId: p.gameId } },
      update: { homeScore: p.homeScore, awayScore: p.awayScore, points: null },
      create: { ...p, points: null },
    });
  }

  console.log('✅ Palpites pré-definidos criados\n');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Bolão de teste pronto!');
  console.log('  URL: /pools/pool-teste-pontuacao');
  console.log('');
  console.log('  Próximos passos para simular:');
  console.log('');
  console.log('  1. Acesse o bolão e vá em "Gerenciar" → rodada desejada');
  console.log('  2. Registre os resultados dos jogos:');
  console.log('');
  console.log('     RODADA 1:');
  console.log('     • Brasil 2 x 1 Argentina');
  console.log('     • França 1 x 1 Alemanha');
  console.log('     • Espanha 1 x 0 Portugal');
  console.log('');
  console.log('     RODADA 2:');
  console.log('     • Inglaterra 0 x 0 Itália');
  console.log('     • EUA 2 x 1 México');
  console.log('');
  console.log('  3. Verifique a tela de palpites de cada participante');
  console.log('     para confirmar os pontos por jogo');
  console.log('');
  console.log('  4. Verifique a classificação:');
  console.log('     Após R1: Carlos 25 · Mthwerner 15 · Pedro 10 · Marina 5');
  console.log('     Após R2: Carlos 35 · Mthwerner 30 · Pedro 20 · Marina 10');
  console.log('═══════════════════════════════════════════════════════════');

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
