const pg = require('pg');

async function main() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log("Checking last 10 orders from DB directly...");
        const result = await pool.query('SELECT id, "fullName", "paymentStatus", "mpPaymentId", "createdAt", "status" FROM "Order" ORDER BY "createdAt" DESC LIMIT 10');
        console.table(result.rows);

        const counts = await pool.query('SELECT "paymentStatus", count(*) FROM "Order" GROUP BY "paymentStatus"');
        console.table(counts.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
