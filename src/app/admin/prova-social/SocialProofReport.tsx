'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export type SocialProofReportData = {
    impressions: number
    shownVisitors: number
    closedVisitors: number
    visitors: number
    seen: number
    seenPaid: number
    unseen: number
    unseenPaid: number
    daily: { date: string; exibicoes: number; visitantes: number }[]
}

// Paleta tinta (espelha os tokens de admin.css)
const C = { ink: '#14151F', muted: '#6E7180', line: '#E5E7EF', sunken: '#F5F6F9', positive: '#1E7A52', info: '#2C5C86', infoSoft: '#BFD6EA' }

const fmtInt = (v: number) => v.toLocaleString('pt-BR')
const plural = (n: number, one: string, many: string) => `${fmtInt(n)} ${n === 1 ? one : many}`
const rate = (part: number, whole: number) => whole > 0 ? (part / whole) * 100 : null
const fmtRate = (r: number | null) => r === null ? '—' : `${r.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

function DailyTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
        <div className="dash-tooltip">
            <p className="dash-tooltip-label">{shortDate(label)}</p>
            <p className="dash-tooltip-value">{plural(d.exibicoes, 'notificação', 'notificações')}</p>
            <p className="dash-tooltip-sub">{plural(d.visitantes, 'visitante', 'visitantes')}</p>
        </div>
    )
}

export default function SocialProofReport({ data }: { data: SocialProofReportData }) {
    const seenRate = rate(data.seenPaid, data.seen)
    const unseenRate = rate(data.unseenPaid, data.unseen)
    const maxRate = Math.max(seenRate ?? 0, unseenRate ?? 0, 0.0001)
    const lift = seenRate !== null && unseenRate !== null && unseenRate > 0 ? ((seenRate - unseenRate) / unseenRate) * 100 : null

    return (
        <div className="dash-stack">
            <section className="dash-card" aria-label="Resumo">
                <div className="dash-stats dash-stats-4">
                    <div className="dash-stat">
                        <p className="dash-stat-label">Notificações exibidas</p>
                        <p className="dash-stat-value">{fmtInt(data.impressions)}</p>
                        <div className="dash-stat-foot">{data.shownVisitors > 0 ? `${(data.impressions / data.shownVisitors).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por visitante` : 'Nenhuma no período'}</div>
                    </div>
                    <div className="dash-stat">
                        <p className="dash-stat-label">Visitantes que viram</p>
                        <p className="dash-stat-value">{fmtInt(data.shownVisitors)}</p>
                        <div className="dash-stat-foot">{fmtRate(rate(data.seen, data.visitors))} dos visitantes do checkout</div>
                    </div>
                    <div className="dash-stat">
                        <p className="dash-stat-label">Fecharam o aviso</p>
                        <p className="dash-stat-value">{fmtInt(data.closedVisitors)}</p>
                        <div className="dash-stat-foot">{fmtRate(rate(data.closedVisitors, data.shownVisitors))} de quem viu</div>
                    </div>
                    <div className="dash-stat">
                        <p className="dash-stat-label">Conversão de quem viu</p>
                        <p className="dash-stat-value">{fmtRate(seenRate)}</p>
                        <div className="dash-stat-foot">{plural(data.seenPaid, 'compra paga', 'compras pagas')}</div>
                    </div>
                </div>
            </section>

            <div className="dash-split">
                <section className="dash-card">
                    <h2 className="dash-card-title">Viu x não viu</h2>
                    <p className="dash-card-sub">Visitantes do checkout no período que pagaram um pedido.</p>
                    {data.visitors > 0 ? (
                        <>
                            {[
                                { label: 'Viram notificação', r: seenRate, paid: data.seenPaid, total: data.seen, color: C.positive },
                                { label: 'Não viram', r: unseenRate, paid: data.unseenPaid, total: data.unseen, color: C.muted },
                            ].map(row => (
                                <div key={row.label} className="dash-barrow">
                                    <div className="dash-barrow-top">
                                        <span className="dash-barrow-label">{row.label}</span>
                                        <span className="dash-barrow-value">
                                            {fmtRate(row.r)}
                                            <span className="dash-barrow-sub">{fmtInt(row.paid)} de {fmtInt(row.total)}</span>
                                        </span>
                                    </div>
                                    <div className="dash-bar-track">
                                        <div style={{ width: `${row.r ? Math.max((row.r / maxRate) * 100, 2) : 0}%`, background: row.color }} />
                                    </div>
                                </div>
                            ))}
                            <p className="od-hint">
                                {lift !== null && Math.abs(lift) >= 1
                                    ? `Quem viu converteu ${Math.abs(lift).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}% ${lift > 0 ? 'mais' : 'menos'} que quem não viu. `
                                    : ''}
                                Quem fica mais tempo no checkout vê mais avisos e tende a comprar mais, então a diferença não é só efeito da notificação.
                            </p>
                        </>
                    ) : (
                        <p className="dash-empty">Sem visitantes rastreados no período.</p>
                    )}
                </section>

                <section className="dash-card">
                    <h2 className="dash-card-title">Por dia</h2>
                    <p className="dash-card-sub">Notificações exibidas e visitantes alcançados.</p>
                    {data.daily.length > 0 ? (
                        <>
                            <div className="dash-legend">
                                <span><i style={{ background: C.infoSoft }} />Exibições</span>
                                <span><i style={{ background: C.info }} />Visitantes</span>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data.daily} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barGap={2}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: C.sunken }} content={<DailyTooltip />} />
                                    <Bar dataKey="exibicoes" fill={C.infoSoft} radius={[4, 4, 0, 0]} maxBarSize={18} />
                                    <Bar dataKey="visitantes" fill={C.info} radius={[4, 4, 0, 0]} maxBarSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    ) : (
                        <p className="dash-empty">Nenhuma notificação exibida no período.</p>
                    )}
                </section>
            </div>
        </div>
    )
}
