
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLogs() {
    try {
        console.log('Checking EmailLog table...');
        const logs = await prisma.emailLog.findMany();
        console.log('Current logs in DB:', logs);

        const count = await prisma.order.count();
        console.log('Total orders in DB:', count);
    } catch (err) {
        console.error('DATABASE ERROR:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkLogs();
