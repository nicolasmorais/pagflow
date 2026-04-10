'use client';
import { useState } from 'react';

export default function TestEnvPage() {
    const [pubKey, setPubKey] = useState('');
    const [accToken, setAccToken] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/check-env', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicKey: pubKey.trim(), accessToken: accToken.trim() })
            });
            const data = await res.json();
            setResult(data);
        } catch (e) {
            setResult({ error: "Falha ao consultar API" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'system-ui', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2 style={{ marginBottom: '10px' }}>Teste de Variáveis de Ambiente (Vercel/Nuvem)</h2>
            <p style={{ color: '#555', marginBottom: '20px', fontSize: '14px' }}>
                Coloque as chaves que você acha que deveriam estar na hospedagem para ver se elas batem com o que o servidor Realmente está lendo por dentro.
            </p>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Public Key esperada (APP_USR-...)</label>
                <input
                    type="text"
                    value={pubKey}
                    onChange={e => setPubKey(e.target.value)}
                    placeholder="Ex: APP_USR-ecbf9e53..."
                    style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #999', borderRadius: '4px' }}
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Access Token esperado (APP_USR-...)</label>
                <input
                    type="text"
                    value={accToken}
                    onChange={e => setAccToken(e.target.value)}
                    placeholder="Ex: APP_USR-7145..."
                    style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #999', borderRadius: '4px' }}
                />
            </div>

            <button
                onClick={handleVerify}
                disabled={loading}
                style={{ background: '#0070f3', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
            >
                {loading ? 'Verificando servidor...' : 'Verificar Chaves'}
            </button>

            {result && (
                <div style={{ marginTop: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '6px' }}>
                    <h3 style={{ marginTop: 0 }}>Resultado do Servidor:</h3>

                    <div style={{ padding: '10px', margin: '10px 0', background: result.publicKeyMatch ? '#d4edda' : '#f8d7da', color: result.publicKeyMatch ? '#155724' : '#721c24', borderRadius: '4px' }}>
                        <strong>Public Key Match: </strong> {result.publicKeyMatch ? '✅ BATEU!' : '❌ NÃO BATE COM A DA NUVEM'}
                        <div style={{ fontSize: '13px', marginTop: '5px' }}>
                            O que o servidor realmente carregou começa com: <code>{result.actualPublicKeyPrefix}</code>
                        </div>
                        <div style={{ fontSize: '13px', marginTop: '5px' }}>
                            O que o navegador (Next.js Public) carregou agora começa com: <code>{process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY.substring(0, 14) + '***' : 'VAZIO'}</code>
                        </div>
                    </div>

                    <div style={{ padding: '10px', margin: '10px 0', background: result.accessTokenMatch ? '#d4edda' : '#f8d7da', color: result.accessTokenMatch ? '#155724' : '#721c24', borderRadius: '4px' }}>
                        <strong>Access Token Match: </strong> {result.accessTokenMatch ? '✅ BATEU!' : '❌ NÃO BATE COM O DA NUVEM'}
                        <div style={{ fontSize: '13px', marginTop: '5px' }}>
                            O que o servidor realmente carregou começa com: <code>{result.actualAccessTokenPrefix}</code>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
