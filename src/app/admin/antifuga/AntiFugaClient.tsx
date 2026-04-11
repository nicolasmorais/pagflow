'use client'

import { useState } from 'react'
import { Shield, TrendingUp, Eye, CheckCircle, XCircle, Clock, Save } from 'lucide-react'

interface Props {
    config: {
        id: string
        isEnabled: boolean
        discountPct: number
        timerSeconds: number
    }
    stats: {
        shown: number
        accepted: number
        declined: number
        expired: number
    }
    chartData: { date: string; shown: number; accepted: number }[]
}

export default function AntiFugaClient({ config, stats, chartData }: Props) {
    const [isEnabled, setIsEnabled] = useState(config.isEnabled)
    const [discountPct, setDiscountPct] = useState(config.discountPct)
    const [timerSeconds, setTimerSeconds] = useState(config.timerSeconds)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const conversionRate = stats.shown > 0
        ? ((stats.accepted / stats.shown) * 100).toFixed(1)
        : '0.0'

    const maxChart = Math.max(...chartData.map(d => d.shown), 1)

    async function handleSave() {
        setSaving(true)
        setSaved(false)
        try {
            await fetch('/api/exit-popup/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isEnabled, discountPct, timerSeconds })
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (e) {
            alert('Erro ao salvar. Tente novamente.')
        } finally {
            setSaving(false)
        }
    }

    const timerMinutes = Math.floor(timerSeconds / 60)
    const timerSecs = timerSeconds % 60

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: 'inherit' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <div style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={24} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Popup Anti-Fuga</h1>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Recupere vendas quando o usuário tenta abandonar o checkout</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>{isEnabled ? 'Ativo' : 'Inativo'}</span>
                    <button
                        onClick={() => setIsEnabled(!isEnabled)}
                        style={{
                            width: '52px', height: '28px', borderRadius: '14px',
                            background: isEnabled ? '#10b981' : '#cbd5e1',
                            border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s'
                        }}
                    >
                        <div style={{
                            width: '22px', height: '22px', borderRadius: '11px', background: 'white',
                            position: 'absolute', top: '3px',
                            left: isEnabled ? '27px' : '3px', transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                    { icon: Eye, label: 'Exibições', value: stats.shown, color: '#3b82f6', bg: '#eff6ff' },
                    { icon: CheckCircle, label: 'Aceitos', value: stats.accepted, color: '#10b981', bg: '#f0fdf4' },
                    { icon: XCircle, label: 'Recusados', value: stats.declined, color: '#ef4444', bg: '#fef2f2' },
                    { icon: TrendingUp, label: 'Conversão', value: `${conversionRate}%`, color: '#f59e0b', bg: '#fffbeb' },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ background: bg, borderRadius: '8px', padding: '6px', display: 'flex' }}>
                                <Icon size={18} color={color} />
                            </div>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{label}</span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Config Card */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '24px', marginTop: 0 }}>⚙️ Configurações</h2>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Desconto oferecido: <strong style={{ color: '#ef4444' }}>{discountPct}%</strong>
                        </label>
                        <input
                            type="range" min={10} max={80} value={discountPct}
                            onChange={e => setDiscountPct(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#ef4444' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                            <span>10%</span><span>80%</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Duração do timer: <strong style={{ color: '#ef4444' }}>
                                {String(timerMinutes).padStart(2, '0')}:{String(timerSecs).padStart(2, '0')}
                            </strong>
                        </label>
                        <input
                            type="range" min={120} max={900} step={30} value={timerSeconds}
                            onChange={e => setTimerSeconds(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#ef4444' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                            <span>2 min</span><span>15 min</span>
                        </div>
                    </div>

                    <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '13px', color: '#b91c1c', lineHeight: 1.5 }}>
                        <strong>Preview do preço:</strong> produto de <strong>R$ 169,90</strong> sairá por{' '}
                        <strong>R$ {(169.90 * (1 - discountPct / 100)).toFixed(2).replace('.', ',')}</strong> no PIX
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            width: '100%', padding: '13px', borderRadius: '10px',
                            background: saved ? '#10b981' : '#ef4444', border: 'none',
                            color: 'white', fontWeight: 700, fontSize: '15px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'background 0.2s'
                        }}
                    >
                        <Save size={16} />
                        {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar Configurações'}
                    </button>
                </div>

                {/* Chart Card */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '24px', marginTop: 0 }}>📊 Últimos 7 dias</h2>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px' }}>
                        {chartData.map(({ date, shown, accepted }) => (
                            <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'flex-end', alignItems: 'center', flex: 1 }}>
                                    <div
                                        style={{
                                            width: '100%', background: '#10b981', borderRadius: '4px 4px 0 0',
                                            height: shown > 0 ? `${Math.max((accepted / maxChart) * 120, accepted > 0 ? 6 : 0)}px` : '0',
                                            transition: 'height 0.3s'
                                        }}
                                        title={`${accepted} aceitos`}
                                    />
                                    <div
                                        style={{
                                            width: '100%', background: '#3b82f6', borderRadius: accepted > 0 ? '0' : '4px 4px 0 0',
                                            height: `${Math.max(((shown - accepted) / maxChart) * 120, shown > 0 ? 4 : 0)}px`,
                                            transition: 'height 0.3s'
                                        }}
                                        title={`${shown} exibições`}
                                    />
                                </div>
                                <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '4px' }}>{date}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#3b82f6' }} />
                            Exibições
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} />
                            Aceitos
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '14px', background: '#f8fafc', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Clock size={14} color="#64748b" />
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Expirados sem interação</span>
                        </div>
                        <span style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>{stats.expired}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>usuários saíram sem agir</span>
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginTop: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', marginTop: 0 }}>🛡️ Como o sistema funciona</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {[
                        { emoji: '📱', title: 'Botão voltar', desc: 'Intercepta o botão voltar nativo do Android e iOS via history.pushState' },
                        { emoji: '👆', title: 'Swipe de volta', desc: 'Detecta o gesto de swipe lateral para voltar via popstate' },
                        { emoji: '🔄', title: 'Bfcache iOS', desc: 'Captura o pageshow com persisted=true no Safari para bfcache' },
                        { emoji: '📴', title: 'App em fundo', desc: 'Ativa quando o usuário troca de app via visibilitychange' },
                        { emoji: '🖱️', title: 'Desktop', desc: 'Mouse saindo pela borda superior da janela do navegador' },
                    ].map(({ emoji, title, desc }) => (
                        <div key={title} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px' }}>
                            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{emoji}</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{title}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
