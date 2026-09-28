export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import AnalyticsCharts from './AnalyticsCharts';

function isoWeek(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function weekLabel(isoKey: string): string {
    const [year, w] = isoKey.split('-W');
    const jan4 = new Date(Number(year), 0, 4);
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (Number(w) - 1) * 7);
    return monday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function addDays(d: Date, n: number) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

export default async function AssinaturasAnalyticsPage() {
    const orders = await prisma.order.findMany({
        where: { paymentMethod: 'pix_automatico', deletedAt: null },
        include: { product: true },
        orderBy: { createdAt: 'asc' },
    });

    const now = new Date();

    // ── KPIs ─────────────────────────────────────────────────────────────
    const total = orders.length;
    const ativas = orders.filter(o => o.paymentStatus === 'pago' && (o.parcelasPagas ?? 0) < (o.totalParcelas ?? 4));
    const concluidas = orders.filter(o => (o.parcelasPagas ?? 0) >= (o.totalParcelas ?? 4));
    const canceladas = orders.filter(o => o.paymentStatus === 'recusado');

    const totalRecebido = orders.reduce((s, o) => s + (o.parcelasPagas ?? 0) * (o.totalPrice ?? 0), 0);
    const totalProjetado = ativas.reduce((s, o) => s + ((o.totalParcelas ?? 4) - (o.parcelasPagas ?? 0)) * (o.totalPrice ?? 0), 0);
    const activeMRR = ativas.reduce((s, o) => s + (o.totalPrice ?? 0), 0);
    const conversionRate = total > 0 ? (orders.filter(o => o.paymentStatus === 'pago').length / total) * 100 : 0;
    const avgParcelas = total > 0 ? orders.reduce((s, o) => s + (o.totalParcelas ?? 4), 0) / total : 0;

    // ── Receita semanal histórica (virtual: createdAt + 7d * parcela) ────
    const historicalMap: Record<string, number> = {};
    for (const o of orders) {
        const paid = o.parcelasPagas ?? 0;
        for (let i = 0; i < paid; i++) {
            const chargeDate = addDays(new Date(o.createdAt), i * 7);
            const key = isoWeek(chargeDate);
            historicalMap[key] = (historicalMap[key] ?? 0) + (o.totalPrice ?? 0);
        }
    }
    // Pegar últimas 10 semanas
    const last10: string[] = [];
    for (let i = 9; i >= 0; i--) {
        last10.push(isoWeek(addDays(now, -i * 7)));
    }
    const weeklyRevenue = last10.map(k => ({
        week: weekLabel(k),
        valor: Math.round((historicalMap[k] ?? 0) * 100) / 100,
    }));

    // ── Projeção futura (próximas 8 semanas) ────────────────────────────
    const projMap: Record<string, number> = {};
    for (const o of ativas) {
        const paid = o.parcelasPagas ?? 0;
        const total_ = o.totalParcelas ?? 4;
        const remaining = total_ - paid;
        for (let i = 0; i < remaining; i++) {
            const chargeDate = addDays(now, (i + 1) * 7);
            const key = isoWeek(chargeDate);
            projMap[key] = (projMap[key] ?? 0) + (o.totalPrice ?? 0);
        }
    }
    const next8: string[] = [];
    for (let i = 1; i <= 8; i++) next8.push(isoWeek(addDays(now, i * 7)));
    const projection = next8.map(k => ({
        week: weekLabel(k),
        valor: Math.round((projMap[k] ?? 0) * 100) / 100,
    }));

    // ── Distribuição de parcelas ─────────────────────────────────────────
    const distMap: Record<number, number> = { 2: 0, 3: 0, 4: 0 };
    for (const o of orders) distMap[o.totalParcelas ?? 4] = (distMap[o.totalParcelas ?? 4] ?? 0) + 1;
    const installmentDist = [
        { name: '2x', value: distMap[2] },
        { name: '3x', value: distMap[3] },
        { name: '4x', value: distMap[4] },
    ].filter(d => d.value > 0);

    // ── Por produto ──────────────────────────────────────────────────────
    const prodMap: Record<string, { name: string; total: number; ativas: number; receita: number }> = {};
    for (const o of orders) {
        const name = o.product?.name ?? 'Sem produto';
        if (!prodMap[name]) prodMap[name] = { name, total: 0, ativas: 0, receita: 0 };
        prodMap[name].total++;
        if (o.paymentStatus === 'pago') {
            prodMap[name].ativas++;
            prodMap[name].receita += (o.parcelasPagas ?? 0) * (o.totalPrice ?? 0);
        }
    }
    const byProduct = Object.values(prodMap).sort((a, b) => b.receita - a.receita);

    // ── Status ao longo do tempo (últimas 8 semanas) ─────────────────────
    const statusWeekMap: Record<string, { pago: number; aguardando: number; cancelado: number }> = {};
    for (const k of last10) statusWeekMap[k] = { pago: 0, aguardando: 0, cancelado: 0 };
    for (const o of orders) {
        const k = isoWeek(new Date(o.createdAt));
        if (!statusWeekMap[k]) continue;
        if (o.paymentStatus === 'pago') statusWeekMap[k].pago++;
        else if (o.paymentStatus === 'recusado') statusWeekMap[k].cancelado++;
        else statusWeekMap[k].aguardando++;
    }
    const statusOverTime = last10.map(k => ({ week: weekLabel(k), ...statusWeekMap[k] }));

    const kpis = { total, ativas: ativas.length, concluidas: concluidas.length, canceladas: canceladas.length, totalRecebido, totalProjetado, activeMRR, conversionRate, avgParcelas };

    return (
        <div style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#0f172a' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <Link href="/admin/assinaturas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 9, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', textDecoration: 'none' }}>
                    <ArrowLeft size={16} />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart3 size={20} color="#16a34a" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Análise de Assinaturas</h1>
                        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Receita recebida, projeções e distribuição</p>
                    </div>
                </div>
            </div>

            <AnalyticsCharts
                kpis={kpis}
                weeklyRevenue={weeklyRevenue}
                projection={projection}
                installmentDist={installmentDist}
                byProduct={byProduct}
                statusOverTime={statusOverTime}
            />
        </div>
    );
}
