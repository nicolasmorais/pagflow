// Copia schema + dados do banco antigo para o banco novo, com UPSERT
// (cobre linhas novas E linhas que mudaram desde a última execução) e
// conferência por checksum de conteúdo (não só contagem).
// Uso: OLD_DB_URL=... NEW_DB_URL=... node scripts/db-migrate/run-migration.mjs
import pg from 'pg'
const { Client, types } = pg

// node-postgres converte timestamp/timestamptz para Date do JS, que só tem
// precisão de milissegundo — isso trunca microssegundos originais do Postgres.
// Mantemos como texto bruto para preservar precisão total na cópia.
types.setTypeParser(1082, val => val) // date
types.setTypeParser(1114, val => val) // timestamp
types.setTypeParser(1184, val => val) // timestamptz

const OLD_DB_URL = process.env.OLD_DB_URL
const NEW_DB_URL = process.env.NEW_DB_URL
if (!OLD_DB_URL || !NEW_DB_URL) {
    console.error('Defina OLD_DB_URL e NEW_DB_URL nas variáveis de ambiente.')
    process.exit(1)
}

// Tabelas já cobertas pelo schema.prisma (criadas via migrate deploy + db push),
// em ordem segura de FK (pais antes dos filhos).
const PRISMA_TABLES = [
    'Product', 'products', 'marketing_pixels', 'customization_settings',
    'PushSubscription', 'push_subscriptions', 'shipping_rules', 'EmailTemplate',
    'FinancialRecord', 'ErrorLog',
    'Order', 'OrderBump', 'sales', 'product_pixels', 'EmailLog',
]

// Tabelas legadas encontradas no banco antigo sem model Prisma correspondente.
const LEGACY_TABLES = [
    'analytics_events', 'back_redirect_events', 'custom_advertorials',
    'page_views', 'pixels', 'popup_interactions', 'routes', 'settings', 'visits',
]

const JSON_OIDS = new Set([114, 3802]) // json, jsonb

function pgTypeFor(col) {
    if (col.data_type === 'ARRAY') {
        const elem = col.udt_name.replace(/^_/, '')
        return `${elem}[]`
    }
    switch (col.data_type) {
        case 'character varying':
            return col.character_maximum_length ? `varchar(${col.character_maximum_length})` : 'varchar'
        case 'numeric':
            return col.numeric_precision ? `numeric(${col.numeric_precision},${col.numeric_scale || 0})` : 'numeric'
        case 'USER-DEFINED':
            return col.udt_name
        default:
            return col.data_type
    }
}

async function getPrimaryKey(client, table) {
    const rows = (await client.query(
        `select kcu.column_name
         from information_schema.table_constraints tc
         join information_schema.key_column_usage kcu
           on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
         where tc.table_schema='public' and tc.table_name=$1 and tc.constraint_type='PRIMARY KEY'
         order by kcu.ordinal_position`,
        [table]
    )).rows
    return rows.map(r => r.column_name)
}

async function createLegacyTable(oldClient, newClient, table) {
    const cols = (await oldClient.query(
        `select column_name, data_type, udt_name, character_maximum_length, numeric_precision, numeric_scale, is_nullable
         from information_schema.columns where table_schema='public' and table_name=$1
         order by ordinal_position`,
        [table]
    )).rows

    const pk = await getPrimaryKey(oldClient, table)
    const colDefs = cols.map(c => `"${c.column_name}" ${pgTypeFor(c)}`)
    if (pk.length > 0) colDefs.push(`PRIMARY KEY (${pk.map(c => `"${c}"`).join(', ')})`)

    await newClient.query(`CREATE TABLE IF NOT EXISTS "${table}" (${colDefs.join(', ')})`)
}

async function copyTable(oldClient, newClient, table, pk) {
    const { rows, fields } = await oldClient.query(`SELECT * FROM "${table}"`)
    if (rows.length === 0) return { table, count: 0 }

    const columns = fields.map(f => f.name)
    const jsonCols = new Set(fields.filter(f => JSON_OIDS.has(f.dataTypeID)).map(f => f.name))
    const colList = columns.map(c => `"${c}"`).join(', ')
    const nonPkCols = columns.filter(c => !pk.includes(c))
    const conflictClause = pk.length === 0
        ? 'ON CONFLICT DO NOTHING'
        : `ON CONFLICT (${pk.map(c => `"${c}"`).join(', ')}) DO UPDATE SET ${nonPkCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ') || 'NOTHING'}`

    const batchSize = 200
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        const values = []
        const rowPlaceholders = batch.map(row => {
            const placeholders = columns.map(col => {
                let val = row[col]
                if (val !== null && jsonCols.has(col)) val = JSON.stringify(val)
                values.push(val)
                return `$${values.length}`
            })
            return `(${placeholders.join(', ')})`
        })
        await newClient.query(
            `INSERT INTO "${table}" (${colList}) VALUES ${rowPlaceholders.join(', ')} ${conflictClause}`,
            values
        )
    }
    return { table, count: rows.length }
}

async function checksum(client, table, pk) {
    // to_jsonb(t) normaliza pela CHAVE (nome da coluna), não pela posição física —
    // então a ordem das colunas na tabela (que difere entre banco antigo e novo,
    // pois um evoluiu por ALTER TABLE ao longo do tempo) não afeta o resultado.
    const orderBy = pk.length > 0 ? pk.map(c => `"${c}"`).join(', ') : '1'
    const r = await client.query(
        `SELECT md5(coalesce(string_agg(t.row_json, '|' ORDER BY ${orderBy}), '')) AS sum
         FROM (SELECT ${pk.length > 0 ? pk.map(c => `"${c}"`).join(', ') + ', ' : ''} to_jsonb(t)::text AS row_json FROM "${table}" t) t`
    )
    return r.rows[0].sum
}

async function main() {
    const oldClient = new Client({ connectionString: OLD_DB_URL })
    const newClient = new Client({ connectionString: NEW_DB_URL })
    await oldClient.connect()
    await newClient.connect()

    await newClient.query('SET session_replication_role = replica')

    console.log('== Recriando tabelas legadas (sem model Prisma), se preciso ==')
    for (const t of LEGACY_TABLES) {
        await createLegacyTable(oldClient, newClient, t)
    }
    console.log('  ok')

    const allTables = [...PRISMA_TABLES, ...LEGACY_TABLES]
    const pkByTable = {}
    for (const t of allTables) pkByTable[t] = await getPrimaryKey(oldClient, t)

    console.log('\n== Sincronizando dados (upsert: novas linhas + linhas alteradas) ==')
    for (const t of allTables) {
        try {
            const r = await copyTable(oldClient, newClient, t, pkByTable[t])
            console.log(`  ${t.padEnd(28)} ${r.count} linha(s) no antigo`)
        } catch (e) {
            console.error(`  ERRO em ${t}: ${e.message}`)
        }
    }

    await newClient.query('SET session_replication_role = DEFAULT')

    console.log('\n== Verificação por checksum de conteúdo (não só contagem) ==')
    let mismatch = false
    for (const t of allTables) {
        const oldCount = (await oldClient.query(`SELECT count(*) FROM "${t}"`)).rows[0].count
        const newCount = (await newClient.query(`SELECT count(*) FROM "${t}"`)).rows[0].count
        const oldSum = await checksum(oldClient, t, pkByTable[t])
        const newSum = await checksum(newClient, t, pkByTable[t])
        const ok = oldCount === newCount && oldSum === newSum
        if (!ok) mismatch = true
        console.log(`  ${t.padEnd(28)} antigo=${oldCount.padStart(6)}  novo=${newCount.padStart(6)}  checksum=${ok ? 'IDÊNTICO' : 'DIVERGENTE'}`)
    }

    await oldClient.end()
    await newClient.end()

    if (mismatch) {
        console.log('\nExistem divergências — não aponte a aplicação para o banco novo ainda.')
        process.exit(1)
    } else {
        console.log('\n100% idêntico, tabela por tabela, linha por linha. Banco novo está pronto.')
    }
}

main().catch(e => { console.error(e); process.exit(1) })
