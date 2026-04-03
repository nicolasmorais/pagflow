'use client'

import { useState } from 'react'
import { sendConfirmationEmail } from '@/app/actions'
import { Mail, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

export default function EmailSection({ orderId, email }: { orderId: string, email: string }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleResend = async () => {
        setLoading(true);
        setStatus('idle');
        try {
            const result = await sendConfirmationEmail(orderId);
            if (result.success) {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '24px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={18} color="#1e293b" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Comunicação pós-venda</h3>
                </div>
                {status === 'success' && (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px' }}>
                        <CheckCircle2 size={14} /> Enviado com sucesso
                    </span>
                )}
                {status === 'error' && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', padding: '4px 10px', borderRadius: '20px' }}>
                        <XCircle size={14} /> Erro ao enviar
                    </span>
                )}
            </div>

            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>E-mail de destino</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{email}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handleResend}
                            disabled={loading}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '8px',
                                background: '#111827',
                                color: '#fff',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                        >
                            {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                            {loading ? 'Enviando...' : 'Reenviar E-mail'}
                        </button>
                    </div>
                </div>

                <p style={{ marginTop: '16px', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    💡 E-mails de confirmação são enviados automaticamente para compras aprovadas.
                </p>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
