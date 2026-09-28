import pg from "pg";
const { Client } = pg;
const NEW_URL = "postgresql://postgres:82lsndpbwgndpyjr@184.107.156.132:5495/postgres";
const c = new Client({ connectionString: NEW_URL });
await c.connect();
const res = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
console.log(res.rows.map(r=>r.table_name));
await c.end();
