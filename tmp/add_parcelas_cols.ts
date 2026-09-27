import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "parcelasPagas" INTEGER NOT NULL DEFAULT 0`);
    console.log('✅ Order.parcelasPagas');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "totalParcelas" INTEGER NOT NULL DEFAULT 4`);
    console.log('✅ Order.totalParcelas');
    console.log('\n🎉 Pronto!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
