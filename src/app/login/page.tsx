'use client'

import { useState } from 'react'
import { loginAction } from '@/app/admin/auth-actions'
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const formData = new FormData(e.currentTarget)
        const result = await loginAction(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0b',
            padding: '24px',
            fontFamily: "'Space Grotesk', sans-serif"
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            <div style={{
                width: '100%',
                maxWidth: '380px',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <ShieldCheck size={26} color="#0a0a0b" strokeWidth={2.5} />
                    </div>
                    <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '20px', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
                        PagFlow
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0, fontWeight: 500 }}>
                        Painel administrativo
                    </p>
                </div>

                {/* Form Card */}
                <div style={{
                    background: '#111113',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px',
                    padding: '24px',
                }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }}>
                                <Lock size={16} />
                            </div>
                            <input
                                type={showPass ? 'text' : 'password'}
                                name="password"
                                placeholder="Senha de acesso"
                                required
                                autoComplete="current-password"
                                style={{
                                    width: '100%',
                                    padding: '13px 44px',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.15s',
                                    fontWeight: 500,
                                }}
                                onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.2)' }}
                                onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.25)', display: 'flex', padding: '4px'
                                }}
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: '10px', padding: '10px 14px',
                                color: '#fca5a5', fontSize: '12px', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '13px',
                                borderRadius: '12px',
                                background: loading ? 'rgba(255,255,255,0.06)' : '#fff',
                                border: 'none',
                                color: loading ? 'rgba(255,255,255,0.3)' : '#0a0a0b',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                minHeight: '46px',
                                transition: 'all 0.15s',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {loading ? 'Verificando...' : 'Entrar'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(255,255,255,0.15)', fontSize: '11px', fontWeight: 500 }}>
                    Acesso restrito · PagFlow © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}
