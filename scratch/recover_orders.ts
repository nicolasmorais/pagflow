import { MercadoPagoConfig, Payment } from 'mercadopago'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'

const DATABASE_URL = process.env.DATABASE_URL!
const MP_TOKEN = process.env.MP_ACCESS_TOKEN!

const statusMap: Record<string, string> = {
    'approved': 'pago',
    'pending': 'aguardando',
    'authorized': 'aguardando',
    'in_process': 'aguardando',
    'rejected': 'recusado',
    'cancelled': 'recusado',
    'refunded': 'reembolsado',
    'charged_back': 'reembolsado',
}

async function main() {
    // 1. Connect to MercadoPago
    const mpConfig = new MercadoPagoConfig({ accessToken: MP_TOKEN })
    const paymentClient = new Payment(mpConfig)

    // 2. Connect to DB via Prisma
    const pool = new pg.Pool({ connectionString: DATABASE_URL })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter } as any)

    console.log('🔍 Buscando pagamentos no MercadoPago...\n')

    let allPayments: any[] = []
    let offset = 0
    const limit = 50

    // Fetch ALL payments (paginated)
    while (true) {
        try {
            const response = await paymentClient.search({
                options: {
                    sort: 'date_created',
                    criteria: 'desc',
                    limit,
                    offset,
                }
            })

            const results = response.results || []
            if (results.length === 0) break

            allPayments = [...allPayments, ...results]
            console.log(`  Encontrados ${results.length} pagamentos (offset ${offset})`)

            if (results.length < limit) break
            offset += limit
        } catch (e: any) {
            console.error('Erro na busca:', e.message)
            break
        }
    }

    console.log(`\n✅ Total de pagamentos encontrados: ${allPayments.length}\n`)

    if (allPayments.length === 0) {
        console.log('Nenhum pagamento encontrado no MercadoPago.')
        await prisma.$disconnect()
        await pool.end()
        return
    }

    // 3. Show summary before importing
    const approved = allPayments.filter(p => p.status === 'approved')
    const pending = allPayments.filter(p => p.status === 'pending' || p.status === 'in_process')
    const rejected = allPayments.filter(p => p.status === 'rejected' || p.status === 'cancelled')

    console.log('📊 Resumo:')
    console.log(`   Aprovados: ${approved.length}`)
    console.log(`   Pendentes: ${pending.length}`)
    console.log(`   Recusados: ${rejected.length}`)
    console.log('')

    // 4. Import each payment as an Order
    let imported = 0
    let skipped = 0
    let errors = 0

    for (const payment of allPayments) {
        try {
            // Check if already imported
            const existing = await prisma.order.findFirst({
                where: { mpPaymentId: String(payment.id) }
            })
            if (existing) {
                skipped++
                continue
            }

            const payer = payment.payer || {}
            const card = payment.card || {}
            const additionalInfo = payment.additional_info || {}
            const items = additionalInfo.items || []
            const firstItem = items[0] || {}
            const shipments = additionalInfo.shipments || {}
            const receiverAddress = shipments.receiver_address || {}

            // Extract customer name from multiple sources
            const fullName = payer.first_name && payer.last_name
                ? `${payer.first_name} ${payer.last_name}`
                : firstItem.title || 'Cliente MercadoPago'

            const paymentMethod = payment.payment_type_id === 'bank_transfer' ? 'pix'
                : payment.payment_type_id === 'credit_card' ? 'credit_card'
                : payment.payment_type_id || 'desconhecido'

            await prisma.order.create({
                data: {
                    fullName: fullName,
                    email: payer.email || null,
                    phone: payer.phone?.number || payer.phone?.area_code ? `${payer.phone?.area_code || ''}${payer.phone?.number || ''}` : null,
                    cpf: payer.identification?.number || null,
                    status: payment.status === 'approved' ? 'processando' : 'pendente',
                    paymentStatus: statusMap[payment.status] || 'aguardando',
                    paymentMethod: paymentMethod,
                    totalPrice: payment.transaction_amount || 0,
                    mpPaymentId: String(payment.id),
                    installments: payment.installments || null,
                    installmentAmount: payment.transaction_details?.installment_amount || null,
                    cardBrand: card.first_six_digits ? payment.payment_method_id : null,
                    netReceived: payment.transaction_details?.net_received_amount || null,
                    createdAt: new Date(payment.date_created),
                    updatedAt: new Date(payment.date_last_updated || payment.date_created),
                    // Address from additional_info if available
                    rua: receiverAddress.street_name || null,
                    numero: receiverAddress.street_number ? String(receiverAddress.street_number) : null,
                    cidade: receiverAddress.city_name || null,
                    estado: receiverAddress.state_name || null,
                    cep: receiverAddress.zip_code || null,
                }
            })
            imported++
            console.log(`  ✅ Importado: ${fullName} — R$ ${payment.transaction_amount} — ${statusMap[payment.status] || payment.status} — ${new Date(payment.date_created).toLocaleDateString('pt-BR')}`)
        } catch (e: any) {
            errors++
            console.error(`  ❌ Erro ao importar pagamento ${payment.id}:`, e.message)
        }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`📦 RESULTADO DA RECUPERAÇÃO:`)
    console.log(`   Importados: ${imported}`)
    console.log(`   Já existiam: ${skipped}`)
    console.log(`   Erros: ${errors}`)
    console.log('='.repeat(50))

    await prisma.$disconnect()
    await pool.end()
}

main().catch(console.error)
