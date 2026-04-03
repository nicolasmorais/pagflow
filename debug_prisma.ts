import { prisma } from './src/lib/prisma';

async function test() {
    try {
        const templates = await prisma.emailTemplate.findMany();
        console.log('Templates found:', templates.length);
    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

test();
