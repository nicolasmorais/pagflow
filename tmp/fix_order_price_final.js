const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
    const url = "postgresql://postgres:postgres@localhost:5432/pagflow"; // Fallback URL commonly used in local dev
    // Actually, I'll try to get it from process.env but I'll hardcode if it fails
    const connectionString = process.env.DATABASE_URL || url;

    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const orders = await prisma.order.findMany({
            where: { id: { startsWith: 'cm04u2m9' } }
        });

        if (orders.length > 0) {
            const id = orders[0].id;
            console.log('Found order:', id);
            await prisma.order.update({
                where: { id },
                data: { totalPrice: 2.00 }
            });
            console.log('Order updated successfully to R$ 2,00');
        } else {
            console.log('Order not found with prefix CM04U2M9');
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
