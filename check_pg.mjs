import { Client } from 'pg';

const client = new Client({
    connectionString: 'postgresql://postgres:hfmhthppvm54t8rz@46.224.198.180:5445/postgres'
});

async function run() {
    await client.connect();
    const res = await client.query('SELECT id, "fullName", status, "paymentStatus", "mpPaymentId" FROM "Order" ORDER BY "createdAt" DESC LIMIT 5');
    console.log(res.rows);
    await client.end();
}

run().catch(console.error);
