import pg from "pg";
const { Client } = pg;

const OLD_URL = "postgresql://postgres:hfmhthppvm54t8rz@46.224.198.180:5445/postgres";
const NEW_URL = "postgresql://postgres:82lsndpbwgndpyjr@184.107.156.132:5495/postgres";

async function getCounts(url) {
  const c = new Client({ connectionString: url });
  await c.connect();
  const tables = await c.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`
  );
  const counts = {};
  for (const { table_name } of tables.rows) {
    const r = await c.query(`SELECT COUNT(*)::int AS n FROM "${table_name}"`);
    counts[table_name] = r.rows[0].n;
  }
  await c.end();
  return counts;
}

const [oldC, newC] = await Promise.all([getCounts(OLD_URL), getCounts(NEW_URL)]);
const allTables = new Set([...Object.keys(oldC), ...Object.keys(newC)]);

console.log("table".padEnd(28), "old".padEnd(10), "new".padEnd(10), "status");
let allOk = true;
for (const t of [...allTables].sort()) {
  const o = oldC[t] ?? "-";
  const n = newC[t] ?? "-";
  const ok = o === n;
  if (!ok) allOk = false;
  console.log(t.padEnd(28), String(o).padEnd(10), String(n).padEnd(10), ok ? "OK" : "MISMATCH");
}
console.log(allOk ? "\nAll tables match." : "\nSome tables do NOT match.");
