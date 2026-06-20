export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { AlertTriangle, Bug, Server, CreditCard, Webhook, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

const LEVEL_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
    critical: { bg: '#fef2f2', color: '#dc2626', label: 'Crítico' },
    error: { bg: '#fee2e2', color: '#b91c1c', label: 'Erro' },
    warning: { bg: '#fef3c7', color: '#d97706', label: 'Aviso' },
};

const SOURCE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    client: { icon: Bug, color: '#6366f1', label: 'Cliente' },
    server: { icon: Server, color: '#3b82f6', label: 'Servidor' },
    payment: { icon: CreditCard, color: '#f59e0b', label: 'Pagamento' },
    webhook: { icon: Webhook, color: '#10b981', label: 'Webhook' },
};

export default async function ErrorsPage({
    searchParams,
}: {
    searchParams: Promise<{ level?: string; source?: string }>
}) {
    const params = await searchParams;
    const where: any = {};
    if (params.level) where.level = params.level;
    if (params.source) where.source = params.source;

    const errors = await prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
    });

    const counts = await prisma.errorLog.groupBy({
        by: ['source', 'level'],
        _count: { id: true },
    });

    const totalErrors = await prisma.errorLog.count();

    return (
        <div style={{ width: '100%', paddingBottom: '60px' }}>
            <header style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(239,68,68,0.3)'
                    }}>
                        <AlertTriangle size={18} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                            Logs de Erro
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontWeight: 500 }}>
                            {totalErrors} erros registrados
                        </p>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <FilterPill label="Todos" active={!params.level && !params.source} />
                {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                    <FilterPill key={key} label={cfg.label} active={params.source === key} href={`?source=${key}${params.level ? `&level=${params.level}` : ''}`} color={cfg.color} />
                ))}
                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
                {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => (
                    <FilterPill key={key} label={cfg.label} active={params.level === key} href={`?level=${key}${params.source ? `&source=${params.source}` : ''}`} color={cfg.color} />
                ))}
            </div>

            {/* Errors List */}
            {errors.length === 0 ? (
                <div style={{
                    background: '#fff', border: '1px solid #f1f5f9', borderRadius: '20px',
                    padding: '60px 40px', textAlign: 'center',
                }}>
                    <AlertTriangle size={32} color="#10b981" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                        Nenhum erro registrado
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                        Tudo funcionando por aqui.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {errors.map((error) => {
                        const lc = LEVEL_CONFIG[error.level] || LEVEL_CONFIG.error;
                        const sc = SOURCE_CONFIG[error.source] || SOURCE_CONFIG.client;
                        const SourceIcon = sc.icon;
                        let metadata: any = null;
                        try { metadata = error.metadata ? JSON.parse(error.metadata) : null; } catch { }

                        return (
                            <details key={error.id} style={{
                                background: '#fff', border: '1px solid #f1f5f9',
                                borderRadius: '14px', overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            }}>
                                <summary style={{
                                    padding: '14px 18px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    listStyle: 'none',
                                }}>
                                    <span style={{
                                        fontSize: '10px', fontWeight: 800, padding: '3px 9px',
                                        borderRadius: '7px', background: lc.bg, color: lc.color,
                                        border: `1.5px solid ${lc.bg}`, whiteSpace: 'nowrap',
                                    }}>
                                        {lc.label}
                                    </span>
                                    <span style={{
                                        fontSize: '10px', fontWeight: 700, padding: '3px 9px',
                                        borderRadius: '7px', background: '#f1f5f9', color: sc.color,
                                        display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                                    }}>
                                        <SourceIcon size={10} />
                                        {sc.label}
                                    </span>
                                    <span style={{
                                        flex: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {error.message}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                        {new Date(error.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </summary>
                                <div style={{ padding: '0 18px 16px', borderTop: '1px solid #f1f5f9' }}>
                                    {error.url && (
                                        <p style={{ fontSize: '12px', color: '#64748b', margin: '10px 0 4px' }}>
                                            <strong>URL:</strong> {error.url}
                                        </p>
                                    )}
                                    {error.stack && (
                                        <pre style={{
                                            fontSize: '11px', color: '#475569', background: '#f8fafc',
                                            padding: '12px', borderRadius: '8px', overflow: 'auto',
                                            whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: '8px 0',
                                            maxHeight: '300px', border: '1px solid #e2e8f0',
                                        }}>
                                            {error.stack}
                                        </pre>
                                    )}
                                    {metadata && (
                                        <pre style={{
                                            fontSize: '11px', color: '#64748b', background: '#f8fafc',
                                            padding: '10px', borderRadius: '8px', overflow: 'auto',
                                            whiteSpace: 'pre-wrap', margin: '8px 0', border: '1px solid #e2e8f0',
                                        }}>
                                            {JSON.stringify(metadata, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function FilterPill({ label, active, color, href }: {
    label: string; active: boolean; color?: string; href?: string;
}) {
    const target = href || '/';
    return (
        <a href={target} style={{
            padding: '7px 14px', borderRadius: '10px',
            border: active ? 'none' : '1px solid #e2e8f0',
            background: active ? (color || '#0f172a') : '#fff',
            color: active ? '#fff' : '#64748b',
            fontSize: '12px', fontWeight: 700, textDecoration: 'none',
            transition: 'all 0.15s',
            boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
        }}>
            {label}
        </a>
    );
}
