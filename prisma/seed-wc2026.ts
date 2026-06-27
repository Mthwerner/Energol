/**
 * Seed – Copa do Mundo FIFA 2026
 *
 * Uso:
 *   npx tsx prisma/seed-wc2026.ts
 *
 * Pré-requisitos:
 *   FOOTBALL_DATA_API_KEY=<sua_chave> no .env ou exportada no shell
 *   DATABASE_URL configurada
 */

import { PrismaClient, RoundStatus, GameStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
import {
  fetchWC2026Matches,
  getRoundDef,
  toGameStatus,
  minDate,
  maxDate,
  WC2026_ROUNDS,
  type FDMatch,
} from '../src/lib/football-data';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const POOL_ID  = 'pool-copa-mundo-2026';
const OWNER_EMAIL = 'carlos@energol.com';

async function main() {
  console.log('🌍 Iniciando seed da Copa do Mundo 2026...\n');

  // ── 1. Buscar partidas na API ────────────────────────────────────────────
  console.log('📡 Buscando partidas em football-data.org...');
  const allMatches = await fetchWC2026Matches();
  console.log(`   ${allMatches.length} partidas recebidas\n`);

  // ── 2. Agrupar por rodada ────────────────────────────────────────────────
  const byRound = new Map<number, FDMatch[]>();
  for (const match of allMatches) {
    const def = getRoundDef(match);
    if (!def) continue;
    if (!byRound.has(def.number)) byRound.set(def.number, []);
    byRound.get(def.number)!.push(match);
  }

  // ── 3. Owner do bolão ────────────────────────────────────────────────────
  const owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) {
    throw new Error(
      `Usuário "${OWNER_EMAIL}" não encontrado. Execute prisma/seed.ts primeiro.`,
    );
  }

  // ── 4. Criar / atualizar pool ────────────────────────────────────────────
  const pool = await prisma.pool.upsert({
    where:  { id: POOL_ID },
    update: { name: 'Copa do Mundo FIFA 2026', description: 'Bolão oficial da Copa do Mundo 2026 – EUA, Canadá e México' },
    create: {
      id: POOL_ID,
      name: 'Copa do Mundo FIFA 2026',
      description: 'Bolão oficial da Copa do Mundo 2026 – EUA, Canadá e México',
      ownerId: owner.id,
    },
  });

  // Garantir que o dono é participante
  await prisma.participant.upsert({
    where:  { userId_poolId: { userId: owner.id, poolId: pool.id } },
    update: {},
    create: { userId: owner.id, poolId: pool.id },
  });

  console.log(`✅ Pool criado: ${pool.name}\n`);

  // ── 5. Criar rodadas e jogos ─────────────────────────────────────────────
  let totalGames = 0;

  for (const def of WC2026_ROUNDS) {
    const matches = byRound.get(def.number) ?? [];

    // Datas da rodada
    const start = matches.length > 0
      ? minDate(matches)
      : new Date(`2026-06-11T00:00:00Z`); // fallback genérico

    const end = matches.length > 0
      ? maxDate(matches)
      : new Date(`2026-07-19T23:59:59Z`);

    // Status da rodada (FINISHED se todos os jogos terminaram, OPEN caso contrário)
    const allFinished = matches.length > 0 && matches.every(
      (m) => m.status === 'FINISHED' || m.status === 'AWARDED',
    );
    const roundStatus: RoundStatus = allFinished ? RoundStatus.FINISHED : RoundStatus.OPEN;

    // stage é salvo para que getKnockoutWeight identifique a fase eliminatória
    const round = await prisma.round.upsert({
      where:  { poolId_number: { poolId: pool.id, number: def.number } },
      update: { name: def.name, startDate: start, endDate: end, status: roundStatus, stage: def.stage },
      create: {
        poolId: pool.id,
        number: def.number,
        name:   def.name,
        startDate: start,
        endDate:   end,
        status: roundStatus,
        stage:  def.stage,
      },
    });

    console.log(`📅 Rodada ${def.number}: ${def.name} — ${matches.length} jogo(s)`);

    // ── Criar / atualizar jogos ──────────────────────────────────────────
    for (const m of matches) {
      const homeTeam = m.homeTeam?.name ?? 'A definir';
      const awayTeam = m.awayTeam?.name ?? 'A definir';
      const homeCrest = m.homeTeam?.crest ?? null;
      const awayCrest = m.awayTeam?.crest ?? null;
      const matchDate = new Date(m.utcDate);
      const status    = toGameStatus(m.status) as GameStatus;
      const homeScore = m.score.fullTime.home;
      const awayScore = m.score.fullTime.away;

      const existingGame = await prisma.game.findFirst({
        where: { externalId: m.id, roundId: round.id },
      });
      if (existingGame) {
        await prisma.game.update({
          where: { id: existingGame.id },
          data: {
            homeTeam, awayTeam, homeCrest, awayCrest,
            matchDate, status,
            homeScore: status === 'FINISHED' ? homeScore : null,
            awayScore: status === 'FINISHED' ? awayScore : null,
          },
        });
      } else {
        await prisma.game.create({
          data: {
            roundId: round.id,
            externalId: m.id,
            homeTeam, awayTeam, homeCrest, awayCrest,
            matchDate, status,
            homeScore: status === 'FINISHED' ? homeScore : null,
            awayScore: status === 'FINISHED' ? awayScore : null,
          },
        });
      }

      totalGames++;
    }
  }

  console.log(`\n✅ ${totalGames} jogos criados/atualizados`);
  console.log(`\n🏆 Bolão "${pool.name}" pronto!`);
  console.log(`   ID do bolão: ${pool.id}`);
  console.log(`   Para convidar jogadores, acesse: /pools/${pool.id}\n`);
}

main()
  .catch((e) => {
    console.error('\n❌ Erro no seed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
