import { prisma } from './src/lib/prisma'

async function main() {
    console.log('Keys on prisma client:', Object.keys(prisma))
    // Also check the models
    const dmmf = (prisma as any)._dmmf
    if (dmmf) {
        console.log('Models in DMMF:', dmmf.modelNames)
    }
}

main().catch(console.error)
