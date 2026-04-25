import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'matheus@energol.com' },
    update: { name: 'Mthwerner', role: 'ADMIN', password: hash },
    create: { name: 'Mthwerner', email: 'matheus@energol.com', password: hash, role: 'ADMIN' },
  });
  console.log('✅ Admin criado/atualizado:', user.email, '| role:', user.role);
}

main().catch(console.error).finally(() => prisma.$disconnect());
