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
            background: 'linear-gradient(135deg, #060b26 0%, #0f172a 60%, #1e1b4b 100%)',
            padding: '24px',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: 'clamp(28px, 6vw, 48px)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.5)'
            }}>
                {/* Logo / Icon */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
                    }}>
                        <ShieldCheck size={28} color="white" />
                    </div>
                    <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '22px', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
                        PagFlow Admin
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>
                        Insira a senha mestra para continuar
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}>
                            <Lock size={16} />
                        </div>
                        <input
                            type={showPass ? 'text' : 'password'}
                            name="password"
                            placeholder="Senha mestra"
                            required
                            autoComplete="current-password"
                            style={{
                                width: '100%',
                                padding: '14px 46px',
                                background: 'rgba(255,255,255,0.06)',
                                border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '16px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border 0.2s'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            style={{
                                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.3)', display: 'flex', padding: 0
                            }}
                        >
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '10px', padding: '10px 14px',
                            color: '#fca5a5', fontSize: '13px', fontWeight: 600
                        }}>
                            ❌ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 800,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            minHeight: '48px',
                            transition: 'all 0.2s',
                            boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
                            letterSpacing: '0.01em'
                        }}
                    >
                        {loading ? 'Verificando...' : 'Entrar no Dashboard'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                    Acesso restrito · PagFlow © 2025
                </p>
            </div>
        </div>
    )
}
