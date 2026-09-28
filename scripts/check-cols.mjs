import pg from "pg";
const { Client } = pg;
const c = new Client({ connectionString: "postgresql://postgres:hfmhthppvm54t8rz@46.224.198.180:5445/postgres" });
await c.connect();
const res = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_pixels' ORDER BY ordinal_position`);
console.log(res.rows);
await c.end();
