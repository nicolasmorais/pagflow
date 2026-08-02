import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const rawClient = new PrismaClient({ adapter })

// ─── Bloquear TODA operação de escrita via Proxy ─────────────────────────────

const WRITE_METHODS = new Set([
  'create', 'createMany', 'createManyAndReturn',
  'update', 'updateMany', 'updateManyAndReturn',
  'upsert',
  'delete', 'deleteMany',
])

function createReadOnlyProxy(model: any): any {
  return new Proxy(model, {
    get(target, prop) {
      if (typeof prop === 'string' && WRITE_METHODS.has(prop)) {
        return () => {
          throw new Error(`[hermes] Operação bloqueada: ${prop}. API é read-only.`)
        }
      }
      return target[prop]
    },
  })
}

function createClientProxy(client: any): any {
  return new Proxy(client, {
    get(target, prop) {
      const value = target[prop]
      // Intercept model accessors (order, product, etc)
      if (typeof prop === 'string' && prop[0] === prop[0].toLowerCase() && prop[0] !== '$' && typeof value === 'object' && value !== null) {
        return createReadOnlyProxy(value)
      }
      // Block raw execution methods
      if (typeof prop === 'string' && (prop === '$executeRaw' || prop === '$executeRawUnsafe' || prop === 'executeRaw' || prop === 'executeRawUnsafe')) {
        return () => {
          throw new Error(`[hermes] Operação bloqueada: ${prop}. API é read-only.`)
        }
      }
      return value
    },
  })
}

export const prisma = createClientProxy(rawClient)
