/**
 * Backfill: salva todos os pedidos existentes no Cloudflare R2.
 * Rodar com: npx ts-node --skip-project tmp/backfill_r2.ts
 * Ou: npx tsx tmp/backfill_r2.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const { uploadOrderBackup } = await import('../src/lib/r2')

    const orders = await prisma.order.findMany({
        include: { product: true },
        orderBy: { createdAt: 'desc' },
    })

    console.log(`Encontrados ${orders.length} pedidos para backup no R2.\n`)

    let success = 0
    let errors = 0

    for (const order of orders) {
        try {
            const result = await uploadOrderBackup(order)
            if (result?.success) {
                console.log(`✅ ${order.fullName} | ${order.id} | ${order.createdAt}`)
                success++
            } else {
                console.log(`⚠️  Falhou: ${order.id} - ${JSON.stringify(result)}`)
                errors++
            }
        } catch (err) {
            console.error(`❌ Erro no pedido ${order.id}:`, err)
            errors++
        }
    }

    console.log(`\n📊 Resultado: ${success} salvos, ${errors} erros de ${orders.length} total.`)
    await prisma.$disconnect()
}

main().catch(console.error)
