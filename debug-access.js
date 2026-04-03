const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

(async () => {
    try {
        const r = await p.$queryRaw`SELECT * FROM "CheckoutAccess" ORDER BY "createdAt" DESC LIMIT 5`;
        console.log(JSON.stringify(r, null, 2));
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
