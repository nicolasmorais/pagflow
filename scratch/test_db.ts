import pg from 'pg'

const DATABASE_URL = process.env.DATABASE_URL!

async function main() {
    const client = new pg.Client(DATABASE_URL)
    await client.connect()

    // List all tables
    const tables = await client.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `)
    console.log('=== TABLES IN DATABASE ===')
    for (const t of tables.rows) {
        const count = await client.query(`SELECT count(*) as cnt FROM "${t.tablename}"`)
        console.log(`  ${t.tablename}: ${count.rows[0].cnt} rows`)
    }

    // Check if old data exists in sales table
    console.log('\n=== CHECKING OLD TABLES ===')
    try {
        const sales = await client.query('SELECT count(*) as cnt FROM sales')
        console.log('sales table:', sales.rows[0].cnt, 'rows')
        if (parseInt(sales.rows[0].cnt) > 0) {
            const sample = await client.query('SELECT id, customer_name, customer_email, status, created_at FROM sales ORDER BY created_at DESC LIMIT 5')
            console.log('Recent sales:', JSON.stringify(sample.rows, null, 2))
        }
    } catch (e: any) {
        console.log('sales table: NOT FOUND')
    }

    try {
        const products = await client.query('SELECT count(*) as cnt FROM products')
        console.log('products (lowercase) table:', products.rows[0].cnt, 'rows')
        if (parseInt(products.rows[0].cnt) > 0) {
            const sample = await client.query('SELECT id, name, price FROM products LIMIT 5')
            console.log('Products:', JSON.stringify(sample.rows, null, 2))
        }
    } catch (e: any) {
        console.log('products table: NOT FOUND')
    }

    // Check Order table (Prisma model)
    try {
        const orders = await client.query('SELECT count(*) as cnt FROM "Order"')
        console.log('"Order" table:', orders.rows[0].cnt, 'rows')
    } catch (e: any) {
        console.log('"Order" table: NOT FOUND')
    }

    try {
        const prods = await client.query('SELECT count(*) as cnt FROM "Product"')
        console.log('"Product" table:', prods.rows[0].cnt, 'rows')
        if (parseInt(prods.rows[0].cnt) > 0) {
            const sample = await client.query('SELECT id, name, price FROM "Product" LIMIT 5')
            console.log('Products:', JSON.stringify(sample.rows, null, 2))
        }
    } catch (e: any) {
        console.log('"Product" table: NOT FOUND')
    }

    // Check migration history
    console.log('\n=== MIGRATION HISTORY ===')
    try {
        const migs = await client.query('SELECT * FROM _prisma_migrations ORDER BY finished_at DESC')
        for (const m of migs.rows) {
            console.log(`  ${m.migration_name} — applied: ${m.finished_at} — rolled_back: ${m.rolled_back_at || 'no'}`)
        }
    } catch (e: any) {
        console.log('No migration table found')
    }

    await client.end()
}

main()
