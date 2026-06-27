import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.pool.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
  .then(pools => pools.forEach(p => console.log(`${p.id}  ${p.name}`)))
  .finally(() => prisma.$disconnect());
