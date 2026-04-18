import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const subs = await prisma.pushSubscription.findMany({
        where: { auth: 'capacitor' }
    })
    console.log('Native Subscriptions:', JSON.stringify(subs, null, 2))
}

main()
