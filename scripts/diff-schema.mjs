import pg from "pg";
const { Client } = pg;

const OLD_URL = "postgresql://postgres:hfmhthppvm54t8rz@46.224.198.180:5445/postgres";
const NEW_URL = "postgresql://postgres:82lsndpbwgndpyjr@184.107.156.132:5495/postgres";

async function getCols(url) {
  const c = new Client({ connectionString: url });
  await c.connect();
  const res = await c.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default,
           character_maximum_length, numeric_precision, numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  await c.end();
  const map = {};
  for (const row of res.rows) {
    map[row.table_name] = map[row.table_name] || [];
    map[row.table_name].push(row);
  }
  return map;
}

const oldCols = await getCols(OLD_URL);
const newCols = await getCols(NEW_URL);

const allTables = new Set([...Object.keys(oldCols), ...Object.keys(newCols)]);

for (const table of allTables) {
  const oldSet = new Set((oldCols[table] || []).map((c) => c.column_name));
  const newSet = new Set((newCols[table] || []).map((c) => c.column_name));

  const missingInNew = [...oldSet].filter((c) => !newSet.has(c));
  const missingInOld = [...newSet].filter((c) => !oldSet.has(c));

  if (missingInNew.length || missingInOld.length) {
    console.log(`\nTable: ${table}`);
    if (missingInNew.length) {
      console.log("  Missing in NEW:", missingInNew);
      for (const cname of missingInNew) {
        const info = oldCols[table].find((c) => c.column_name === cname);
        console.log("   ", JSON.stringify(info));
      }
    }
    if (missingInOld.length) console.log("  Extra in NEW (missing in OLD):", missingInOld);
  }
}
