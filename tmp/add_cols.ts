import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subscriptionMandateId" TEXT`);
    console.log('✅ Order.subscriptionMandateId');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subscriptionEnabled" BOOLEAN NOT NULL DEFAULT false`);
    console.log('✅ Product.subscriptionEnabled');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subscriptionPlanToken" TEXT`);
    console.log('✅ Product.subscriptionPlanToken');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subscriptionPrice" DOUBLE PRECISION`);
    console.log('✅ Product.subscriptionPrice');
    console.log('\n🎉 Pronto!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
