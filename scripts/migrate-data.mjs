import pg from "pg";

const { Client } = pg;

const OLD_URL = "postgresql://postgres:hfmhthppvm54t8rz@46.224.198.180:5445/postgres";
const NEW_URL = "postgresql://postgres:82lsndpbwgndpyjr@184.107.156.132:5495/postgres";

// Order matters: parents before children (FK dependencies)
const TABLES = [
  "Product",
  "products",
  "marketing_pixels",
  "OrderBump",
  "product_pixels",
  "Order",
  "EmailLog",
  "CheckoutEvent",
  "WebVital",
  "customization_settings",
  "PushSubscription",
  "push_subscriptions",
  "sales",
  "shipping_rules",
  "EmailTemplate",
  "FinancialRecord",
  "ErrorLog",
];

function quoteIdent(name) {
  return `"${name}"`;
}

async function main() {
  const oldClient = new Client({ connectionString: OLD_URL });
  const newClient = new Client({ connectionString: NEW_URL });
  await oldClient.connect();
  await newClient.connect();

  await newClient.query("SET session_replication_role = 'replica';"); // disable FK checks during load

  const summary = [];

  try {
    for (const table of TABLES) {
      const res = await oldClient.query(`SELECT * FROM ${quoteIdent(table)}`);
      const rows = res.rows;

      if (rows.length === 0) {
        summary.push({ table, count: 0 });
        continue;
      }

      const columns = Object.keys(rows[0]);
      const colList = columns.map(quoteIdent).join(", ");

      await newClient.query("BEGIN");
      let inserted = 0;
      for (const row of rows) {
        const values = columns.map((c) => row[c]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        const sql = `INSERT INTO ${quoteIdent(table)} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        await newClient.query(sql, values);
        inserted++;
      }
      await newClient.query("COMMIT");

      summary.push({ table, count: inserted });
      console.log(`${table}: ${inserted} rows copied`);
    }
  } catch (err) {
    await newClient.query("ROLLBACK").catch(() => {});
    console.error("ERROR:", err);
    throw err;
  } finally {
    await newClient.query("SET session_replication_role = 'origin';");
    await oldClient.end();
    await newClient.end();
  }

  console.log("\n=== Summary ===");
  for (const s of summary) console.log(`${s.table}: ${s.count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
