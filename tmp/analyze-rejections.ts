import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

(async () => {
    const rejected = await prisma.order.findMany({
        where: { paymentStatus: 'recusado' },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, fullName: true, email: true, cpf: true, paymentMethod: true, totalPrice: true, mpPaymentId: true, createdAt: true, cardBrand: true }
    });
    console.log('=== PEDIDOS RECUSADOS (últimos 30) ===');
    rejected.forEach(o => console.log(JSON.stringify(o)));

    const errors = await prisma.errorLog.findMany({
        where: { source: 'payment' },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { id: true, message: true, metadata: true, createdAt: true }
    });
    console.log('\n=== LOGS DE ERRO PAGAMENTO (últimos 15) ===');
    errors.forEach(e => console.log(JSON.stringify(e)));

    const stats = await prisma.order.groupBy({
        by: ['paymentStatus'],
        _count: { id: true },
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });
    console.log('\n=== STATUS DOS PAGAMENTOS (últimos 30 dias) ===');
    stats.forEach(s => console.log(`${s.paymentStatus}: ${s._count.id}`));

    const cardStats = await prisma.order.groupBy({
        by: ['paymentMethod'],
        _count: { id: true },
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });
    console.log('\n=== MÉTODOS DE PAGAMENTO (últimos 30 dias) ===');
    cardStats.forEach(s => console.log(`${s.paymentMethod}: ${s._count.id}`));

    const cardRejected = await prisma.order.findMany({
        where: { paymentStatus: 'recusado', paymentMethod: 'credito' },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, fullName: true, cpf: true, totalPrice: true, mpPaymentId: true, createdAt: true, cardBrand: true }
    });
    console.log('\n=== CARTÕES RECUSADOS (últimos 30) ===');
    cardRejected.forEach(o => console.log(JSON.stringify(o)));

    await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
