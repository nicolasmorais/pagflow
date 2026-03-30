async function testApi() {
    const payload = {
        method: 'pix',
        orderData: {
            nome: 'Teste API',
            email: 'teste@api.com',
            telefone: '11999999999',
            cpf: '12345678901',
            destinatario: 'Teste API',
            cep: '01310100',
            rua: 'Av Paulista',
            numero: '1000',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            estado: 'SP',
            productId: 'cmmik57fn0001ugvddcmfmr5e',
            price: 193.05
        }
    };

    try {
        const res = await fetch('http://localhost:3000/api/process-payment', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        console.log('API Result:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testApi();
