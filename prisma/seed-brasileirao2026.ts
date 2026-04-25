/**
 * Seed – Brasileirão Série A 2026
 *
 * Uso:
 *   npm run db:seed-brasileirao2026
 *
 * Pré-requisitos:
 *   FOOTBALL_DATA_API_KEY=<sua_chave> no .env
 *   DATABASE_URL configurada
 *   Usuário matheus@energol.com já criado (npm run db:seed ou seed-test)
 */

import { PrismaClient, RoundStatus, GameStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
import {
  fetchBR2026Matches,
  getRoundDef,
  toGameStatus,
  minDate,
  maxDate,
  BSA2026_ROUNDS,
  type FDMatch,
} from '../src/lib/football-data';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const POOL_ID     = 'pool-brasileirao-2026';
const OWNER_EMAIL = 'matheus@energol.com';

async function main() {
  console.log('🇧🇷 Iniciando seed do Brasileirão Série A 2026...\n');

  // ── 1. Buscar partidas na API ────────────────────────────────────────────
  console.log('📡 Buscando partidas em football-data.org (BSA/2026)...');
  const allMatches = await fetchBR2026Matches();
  console.log(`   ${allMatches.length} partidas recebidas\n`);

  // ── 2. Agrupar por rodada ────────────────────────────────────────────────
  const byRound = new Map<number, FDMatch[]>();
  for (const match of allMatches) {
    const def = getRoundDef(match, BSA2026_ROUNDS);
    if (!def) continue;
    if (!byRound.has(def.number)) byRound.set(def.number, []);
    byRound.get(def.number)!.push(match);
  }

  const roundsWithMatches = byRound.size;
  console.log(`   Rodadas com jogos mapeados: ${roundsWithMatches}/38\n`);

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
    update: {
      name: 'Brasileirão Série A 2026',
      description: 'Bolão oficial do Campeonato Brasileiro Série A 2026',
    },
    create: {
      id: POOL_ID,
      name: 'Brasileirão Série A 2026',
      description: 'Bolão oficial do Campeonato Brasileiro Série A 2026',
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
  let roundsCreated = 0;

  for (const def of BSA2026_ROUNDS) {
    const matches = byRound.get(def.number) ?? [];

    // Pular rodadas sem partidas ainda (fixture ainda não divulgado)
    if (matches.length === 0) {
      process.stdout.write(`⏭  Rodada ${String(def.number).padStart(2, '0')}: sem jogos na API ainda — pulando\n`);
      continue;
    }

    const start = minDate(matches);
    const end   = maxDate(matches);

    const allFinished = matches.every(
      (m) => m.status === 'FINISHED' || m.status === 'AWARDED',
    );
    const roundStatus: RoundStatus = allFinished ? RoundStatus.FINISHED : RoundStatus.OPEN;

    const round = await prisma.round.upsert({
      where:  { poolId_number: { poolId: pool.id, number: def.number } },
      update: { name: def.name, startDate: start, endDate: end, status: roundStatus },
      create: {
        poolId:    pool.id,
        number:    def.number,
        name:      def.name,
        startDate: start,
        endDate:   end,
        status:    roundStatus,
      },
    });

    // ── Jogos ──────────────────────────────────────────────────────────────
    for (const m of matches) {
      const homeTeam  = m.homeTeam?.shortName ?? m.homeTeam?.name  ?? 'A definir';
      const awayTeam  = m.awayTeam?.shortName ?? m.awayTeam?.name  ?? 'A definir';
      const homeCrest = m.homeTeam?.crest ?? null;
      const awayCrest = m.awayTeam?.crest ?? null;
      const matchDate = new Date(m.utcDate);
      const status    = toGameStatus(m.status) as GameStatus;
      const homeScore = m.score.fullTime.home;
      const awayScore = m.score.fullTime.away;

      await prisma.game.upsert({
        where:  { externalId: m.id },
        update: {
          homeTeam, awayTeam, homeCrest, awayCrest,
          matchDate, status,
          group: m.group ?? null,
          homeScore: status === 'FINISHED' ? homeScore : null,
          awayScore: status === 'FINISHED' ? awayScore : null,
        },
        create: {
          roundId: round.id,
          externalId: m.id,
          homeTeam, awayTeam, homeCrest, awayCrest,
          matchDate, status,
          group: m.group ?? null,
          homeScore: status === 'FINISHED' ? homeScore : null,
          awayScore: status === 'FINISHED' ? awayScore : null,
        },
      });

      totalGames++;
    }

    const statusLabel = roundStatus === 'FINISHED' ? '✅ finalizada' : '🟢 aberta';
    process.stdout.write(
      `📅 Rodada ${String(def.number).padStart(2, '0')}: ${matches.length} jogo(s)  ${statusLabel}\n`,
    );
    roundsCreated++;
  }

  console.log(`\n✅ ${roundsCreated} rodadas e ${totalGames} jogos criados/atualizados`);
  console.log(`\n🏆 Bolão "${pool.name}" pronto!`);
  console.log(`   ID: ${pool.id}`);
  console.log(`   URL: /pools/${pool.id}`);
  console.log(`\n   Para sincronizar resultados no futuro, rode novamente:`);
  console.log(`   npm run db:seed-brasileirao2026\n`);
}

main()
  .catch((e) => {
    console.error('\n❌ Erro no seed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
