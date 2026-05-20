'use client'

import { useState } from 'react'
import { loginAction } from '@/app/admin/auth-actions'
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [focused, setFocused] = useState(false)

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
            background: '#050505',
            padding: '24px',
            fontFamily: "'Space Grotesk', sans-serif",
            position: 'relative',
            overflow: 'hidden',
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            {/* Gradient orbs */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-10%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />

            <div style={{
                width: '100%',
                maxWidth: '400px',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <img
                        src="https://pub-da9fd1c19b8e45d691d67626b9a7ba6d.r2.dev/1779247326232-1774828533696-1774828360577-019d3c03-84c9-7750-9ed0-2cd31fab976b-(1).png"
                        alt="PagFlow"
                        style={{ height: '36px', marginBottom: '24px' }}
                    />
                    <h1 style={{
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '26px',
                        margin: '0 0 8px',
                        letterSpacing: '-0.04em',
                    }}>
                        Bem-vindo de volta
                    </h1>
                </div>

                {/* Form Card */}
                <div style={{
                    background: 'rgba(17,17,19,0.8)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '20px',
                    padding: '32px 28px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '12px',
                                fontWeight: 600,
                                marginBottom: '8px',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                            }}>
                                Senha de acesso
                            </label>
                            <div style={{
                                position: 'relative',
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.03)',
                                border: `1.5px solid ${error ? 'rgba(239,68,68,0.5)' : focused ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                                transition: 'all 0.2s',
                                boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                            }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }}>
                                    <Lock size={16} />
                                </div>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Digite sua senha"
                                    required
                                    autoComplete="current-password"
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    style={{
                                        width: '100%',
                                        padding: '15px 48px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '15px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        fontWeight: 500,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.25)', display: 'flex', padding: '4px',
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: '12px', padding: '12px 16px',
                                color: '#fca5a5', fontSize: '13px', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '15px',
                                borderRadius: '14px',
                                background: loading ? 'rgba(255,255,255,0.06)' : '#fff',
                                border: 'none',
                                color: loading ? 'rgba(255,255,255,0.3)' : '#0a0a0b',
                                fontSize: '15px',
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                minHeight: '50px',
                                transition: 'all 0.2s',
                                letterSpacing: '-0.01em',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginTop: '4px',
                                boxShadow: loading ? 'none' : '0 4px 16px rgba(255,255,255,0.1)',
                            }}
                            onMouseEnter={e => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-1px)'
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.15)'
                                }
                            }}
                            onMouseLeave={e => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,255,255,0.1)'
                                }
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{
                                        width: '16px', height: '16px',
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        borderTopColor: 'rgba(255,255,255,0.6)',
                                        borderRadius: '50%',
                                        animation: 'spin 0.6s linear infinite',
                                    }} />
                                    Verificando...
                                </>
                            ) : (
                                <>
                                    Entrar no painel
                                    <ArrowRight size={16} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '28px' }}>
                    <p style={{
                        color: 'rgba(255,255,255,0.15)',
                        fontSize: '11px',
                        fontWeight: 500,
                        margin: '0 0 6px',
                    }}>
                        Acesso restrito a administradores
                    </p>
                    <p style={{
                        color: 'rgba(255,255,255,0.1)',
                        fontSize: '11px',
                        fontWeight: 500,
                        margin: 0,
                    }}>
                        PagFlow © {new Date().getFullYear()}
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                input::placeholder {
                    color: rgba(255,255,255,0.2) !important;
                }
            `}</style>
        </div>
    )
}
