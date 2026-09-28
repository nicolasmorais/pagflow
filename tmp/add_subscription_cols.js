const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subscriptionMandateId" TEXT`);
    console.log('✅ Order.subscriptionMandateId');

    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subscriptionEnabled" BOOLEAN NOT NULL DEFAULT false`);
    console.log('✅ Product.subscriptionEnabled');

    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subscriptionPlanToken" TEXT`);
    console.log('✅ Product.subscriptionPlanToken');

    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subscriptionPrice" DOUBLE PRECISION`);
    console.log('✅ Product.subscriptionPrice');

    console.log('\n🎉 Colunas adicionadas com sucesso!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
