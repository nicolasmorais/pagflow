import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const client = new PrismaClient({ adapter })

// ─── Bloquear TODA operação de escrita ───────────────────────────────────────

const WRITE_OPS = ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany', 'executeRaw', 'executeRawUnsafe', '$executeRaw', '$executeRawUnsafe']

client.$use(async (params, next) => {
  if (WRITE_OPS.includes(params.action)) {
    throw new Error(`[hermes] Operação bloqueada: ${params.action} em ${params.model}. API é read-only.`)
  }
  return next(params)
})

export const prisma = client
