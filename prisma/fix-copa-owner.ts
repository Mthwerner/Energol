import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  const matheus = await prisma.user.findUniqueOrThrow({ where: { email: 'matheus@energol.com' } });

  await prisma.pool.update({
    where: { id: 'pool-copa-mundo-2026' },
    data: { ownerId: matheus.id },
  });

  await prisma.participant.upsert({
    where: { userId_poolId: { userId: matheus.id, poolId: 'pool-copa-mundo-2026' } },
    update: { isActive: true },
    create: { userId: matheus.id, poolId: 'pool-copa-mundo-2026' },
  });

  console.log('✅ Dono da Copa do Mundo atualizado para:', matheus.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
