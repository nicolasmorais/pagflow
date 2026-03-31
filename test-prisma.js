const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const order = await prisma.order.create({
            data: {
                fullName: 'Test User',
                email: 'test@example.com',
                phone: '11999999999',
                cpf: '12345678901',
                cep: '01001000',
                rua: 'Rua Teste',
                numero: '123',
                bairro: 'Centro',
                cidade: 'São Paulo',
                estado: 'SP',
                paymentStatus: 'pendente',
                totalPrice: 100,
                selectedBumps: ['test-bump-1'],
                hasBump: true
            }
        });
        console.log('Success:', order.id);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
