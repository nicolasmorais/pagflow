import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "WebhookEvent" (
            "id"          TEXT NOT NULL,
            "eventId"     TEXT NOT NULL,
            "event"       TEXT NOT NULL,
            "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
        )
    `);
    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId")
    `);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "WebhookEvent_eventId_idx" ON "WebhookEvent"("eventId")
    `);
    console.log('✅ WebhookEvent table criada');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
