import { MercadoPagoConfig } from 'mercadopago';

const token = process.env.MP_ACCESS_TOKEN;
if (!token) {
    console.error('[MP] ⚠️  MP_ACCESS_TOKEN não está definido! Verifique as variáveis de ambiente do Dokploy.');
} else {
    console.log(`[MP] ✅ Token configurado (${token.substring(0, 10)}...)`);
}

export function createMpClient() {
    return new MercadoPagoConfig({
        accessToken: token || '',
        options: {
            timeout: 30000,
            compress: false,
        } as any,
    });
}
