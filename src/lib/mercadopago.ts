import { MercadoPagoConfig } from 'mercadopago';

export function createMpClient() {
    return new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN || '',
        options: {
            timeout: 30000,
            headers: {
                'Accept-Encoding': 'identity',
            },
        } as any,
    });
}
