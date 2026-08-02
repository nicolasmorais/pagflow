#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js';
const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));
// ─── Auth middleware ──────────────────────────────────────────────────────────
const API_KEY = process.env.API_KEY || 'hermes-pagflow-key';
function auth(req, res, next) {
    const key = req.headers['x-api-key'] || req.query.key;
    if (key !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}
app.use('/api', auth);
// ─── Helpers ─────────────────────────────────────────────────────────────────
function dateFilter(from, to) {
    const where = {};
    if (from || to) {
        where.createdAt = {};
        if (from)
            where.createdAt.gte = new Date(from);
        if (to)
            where.createdAt.lte = new Date(to + 'T23:59:59');
    }
    return where;
}
// ─── GET /api/health ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', name: 'hermes-pagflow', version: '2.0.0' });
});
// ─── GET /api/sales-summary ──────────────────────────────────────────────────
app.get('/api/sales-summary', async (req, res) => {
    try {
        const { from, to, productId } = req.query;
        const where = dateFilter(from, to);
        if (productId)
            where.productId = productId;
        const orders = await prisma.order.findMany({
            where,
            select: { totalPrice: true, paymentStatus: true, paymentMethod: true, hasBump: true },
        });
        const paid = orders.filter(o => o.paymentStatus === 'pago');
        const totalRevenue = paid.reduce((s, o) => s + o.totalPrice, 0);
        const avgTicket = paid.length > 0 ? totalRevenue / paid.length : 0;
        const byMethod = {};
        for (const o of paid) {
            const m = o.paymentMethod || 'desconhecido';
            if (!byMethod[m])
                byMethod[m] = { count: 0, revenue: 0 };
            byMethod[m].count++;
            byMethod[m].revenue += o.totalPrice;
        }
        res.json({
            periodo: { de: from || 'inicio', ate: to || 'agora' },
            total_pedidos: orders.length,
            pagos: paid.length,
            pendentes: orders.filter(o => o.paymentStatus === 'pendente').length,
            cancelados: orders.filter(o => o.paymentStatus === 'cancelado').length,
            receita_total: +totalRevenue.toFixed(2),
            ticket_medio: +avgTicket.toFixed(2),
            taxa_bump: `${paid.length > 0 ? (paid.filter(o => o.hasBump).length / paid.length * 100).toFixed(1) : 0}%`,
            por_metodo: byMethod,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/orders ─────────────────────────────────────────────────────────
app.get('/api/orders', async (req, res) => {
    try {
        const { from, to, status, paymentStatus, paymentMethod, productId, email, limit, offset } = req.query;
        const where = dateFilter(from, to);
        if (status)
            where.status = status;
        if (paymentStatus)
            where.paymentStatus = paymentStatus;
        if (paymentMethod)
            where.paymentMethod = paymentMethod;
        if (productId)
            where.productId = productId;
        if (email)
            where.email = { contains: email, mode: 'insensitive' };
        const take = parseInt(limit || '50');
        const skip = parseInt(offset || '0');
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: { product: { select: { name: true, price: true } } },
                orderBy: { createdAt: 'desc' },
                take, skip,
            }),
            prisma.order.count({ where }),
        ]);
        res.json({
            total, mostrando: orders.length, offset: skip,
            pedidos: orders.map(o => ({
                id: o.id,
                cliente: { nome: o.fullName, email: o.email, telefone: o.phone, cpf: o.cpf },
                produto: o.product?.name || 'N/A',
                valor: o.totalPrice,
                status: o.status,
                pagamento: { status: o.paymentStatus, metodo: o.paymentMethod, parcelas: o.installments },
                rastreio: o.trackingCode || null,
                utm: { source: o.utmSource, medium: o.utmMedium, campaign: o.utmCampaign },
                data: o.createdAt,
            })),
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/orders/:id ─────────────────────────────────────────────────────
app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { product: true, emailLogs: true },
        });
        if (!order)
            return res.status(404).json({ error: 'Pedido não encontrado' });
        res.json({
            id: order.id,
            cliente: { nome: order.fullName, email: order.email, telefone: order.phone, cpf: order.cpf },
            endereco: { cep: order.cep, rua: order.rua, numero: order.numero, complemento: order.complemento, bairro: order.bairro, cidade: order.cidade, estado: order.estado },
            produto: order.product ? { id: order.product.id, nome: order.product.name, preco: order.product.price, loja: order.product.storeName } : null,
            pedido: { status: order.status, valor_total: order.totalPrice, frete: order.shippingPrice, bump: order.hasBump },
            pagamento: { status: order.paymentStatus, metodo: order.paymentMethod, parcelas: order.installments, bandeira: order.cardBrand, liquido: order.netReceived, mp_payment_id: order.mpPaymentId },
            rastreio: { codigo: order.trackingCode, url: order.trackingUrl },
            utm: { source: order.utmSource, medium: order.utmMedium, campaign: order.utmCampaign },
            emails: order.emailLogs.map(e => ({ tipo: e.type, status: e.status, enviado_em: e.sentAt })),
            criado_em: order.createdAt,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/orders/search ──────────────────────────────────────────────────
app.get('/api/orders/search', async (req, res) => {
    try {
        const { q, limit } = req.query;
        if (!q)
            return res.status(400).json({ error: 'Parâmetro q obrigatório' });
        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { fullName: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    { cpf: { contains: q } },
                    { mpPaymentId: { contains: q } },
                    { trackingCode: { contains: q, mode: 'insensitive' } },
                ],
            },
            include: { product: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit || '20'),
        });
        res.json({
            busca: q, encontrados: orders.length,
            pedidos: orders.map(o => ({
                id: o.id, cliente: o.fullName, email: o.email,
                produto: o.product?.name || 'N/A', valor: o.totalPrice,
                status: o.status, pagamento: o.paymentStatus, data: o.createdAt,
            })),
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/products ───────────────────────────────────────────────────────
app.get('/api/products', async (_req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: { _count: { select: { orders: true } } },
            orderBy: { name: 'asc' },
        });
        res.json(products.map(p => ({
            id: p.id, nome: p.name, preco: p.price, custo: p.cost,
            comissao: p.commission, loja: p.storeName, digital: p.isDigital,
            total_vendas: p._count.orders,
            receita_estimada: +(p.price * p._count.orders).toFixed(2),
        })));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/top-products ───────────────────────────────────────────────────
app.get('/api/top-products', async (req, res) => {
    try {
        const { from, to, limit } = req.query;
        const where = dateFilter(from, to);
        where.paymentStatus = 'pago';
        const orders = await prisma.order.findMany({ where, select: { productId: true, totalPrice: true } });
        const grouped = {};
        for (const o of orders) {
            const pid = o.productId || 'sem-produto';
            if (!grouped[pid])
                grouped[pid] = { count: 0, revenue: 0 };
            grouped[pid].count++;
            grouped[pid].revenue += o.totalPrice;
        }
        const products = await prisma.product.findMany({ select: { id: true, name: true } });
        const nameMap = Object.fromEntries(products.map(p => [p.id, p.name]));
        const ranking = Object.entries(grouped)
            .map(([pid, data]) => ({
            produto: nameMap[pid] || pid, produto_id: pid,
            vendas: data.count, receita: +data.revenue.toFixed(2),
            ticket_medio: +(data.revenue / data.count).toFixed(2),
        }))
            .sort((a, b) => b.receita - a.receita)
            .slice(0, parseInt(limit || '10'));
        res.json({ ranking });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/sales-by-period ────────────────────────────────────────────────
app.get('/api/sales-by-period', async (req, res) => {
    try {
        const { from, to, groupBy = 'day', productId } = req.query;
        const where = dateFilter(from, to);
        where.paymentStatus = 'pago';
        if (productId)
            where.productId = productId;
        const orders = await prisma.order.findMany({
            where, select: { createdAt: true, totalPrice: true }, orderBy: { createdAt: 'asc' },
        });
        const grouped = {};
        for (const o of orders) {
            const d = new Date(o.createdAt);
            let key;
            if (groupBy === 'week') {
                const start = new Date(d);
                start.setDate(d.getDate() - d.getDay());
                key = start.toISOString().slice(0, 10);
            }
            else if (groupBy === 'month') {
                key = d.toISOString().slice(0, 7);
            }
            else {
                key = d.toISOString().slice(0, 10);
            }
            if (!grouped[key])
                grouped[key] = { count: 0, revenue: 0 };
            grouped[key].count++;
            grouped[key].revenue += o.totalPrice;
        }
        res.json({
            agrupamento: groupBy,
            series: Object.entries(grouped).map(([periodo, data]) => ({
                periodo, vendas: data.count, receita: +data.revenue.toFixed(2),
            })),
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/utm-performance ────────────────────────────────────────────────
app.get('/api/utm-performance', async (req, res) => {
    try {
        const { from, to, groupBy = 'source' } = req.query;
        const where = dateFilter(from, to);
        where.paymentStatus = 'pago';
        const orders = await prisma.order.findMany({
            where, select: { totalPrice: true, utmSource: true, utmMedium: true, utmCampaign: true },
        });
        const grouped = {};
        for (const o of orders) {
            const key = (groupBy === 'medium' ? o.utmMedium : groupBy === 'campaign' ? o.utmCampaign : o.utmSource) || 'direto';
            if (!grouped[key])
                grouped[key] = { count: 0, revenue: 0 };
            grouped[key].count++;
            grouped[key].revenue += o.totalPrice;
        }
        res.json({
            agrupado_por: groupBy,
            campanhas: Object.entries(grouped)
                .map(([key, data]) => ({ [groupBy]: key, vendas: data.count, receita: +data.revenue.toFixed(2), ticket_medio: +(data.revenue / data.count).toFixed(2) }))
                .sort((a, b) => b.receita - a.receita),
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/financial ──────────────────────────────────────────────────────
app.get('/api/financial', async (req, res) => {
    try {
        const { from, to, type, category } = req.query;
        const where = {};
        if (from || to) {
            where.date = {};
            if (from)
                where.date.gte = new Date(from);
            if (to)
                where.date.lte = new Date(to + 'T23:59:59');
        }
        if (type)
            where.type = type;
        if (category)
            where.category = category;
        const records = await prisma.financialRecord.findMany({ where, orderBy: { date: 'desc' } });
        const totalReceita = records.filter(r => r.type === 'receita').reduce((s, r) => s + r.amount, 0);
        const totalDespesa = records.filter(r => r.type === 'despesa').reduce((s, r) => s + r.amount, 0);
        res.json({
            resumo: { total_receita: +totalReceita.toFixed(2), total_despesa: +totalDespesa.toFixed(2), lucro: +(totalReceita - totalDespesa).toFixed(2) },
            registros: records.map(r => ({ id: r.id, tipo: r.type, categoria: r.category, descricao: r.description, valor: r.amount, data: r.date })),
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/dashboard-kpis ─────────────────────────────────────────────────
app.get('/api/dashboard-kpis', async (req, res) => {
    try {
        const { from, to } = req.query;
        const where = dateFilter(from, to);
        const allOrders = await prisma.order.findMany({
            where, select: { totalPrice: true, paymentStatus: true, paymentMethod: true, createdAt: true },
        });
        const paid = allOrders.filter(o => o.paymentStatus === 'pago');
        const totalRevenue = paid.reduce((s, o) => s + o.totalPrice, 0);
        let prevRevenue = 0;
        if (from && to) {
            const fromD = new Date(from), toD = new Date(to + 'T23:59:59');
            const diff = toD.getTime() - fromD.getTime();
            const prevOrders = await prisma.order.findMany({
                where: { createdAt: { gte: new Date(fromD.getTime() - diff), lte: fromD } },
                select: { totalPrice: true, paymentStatus: true },
            });
            prevRevenue = prevOrders.filter(o => o.paymentStatus === 'pago').reduce((s, o) => s + o.totalPrice, 0);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = paid.filter(o => new Date(o.createdAt) >= today);
        const byMethod = {};
        for (const o of paid) {
            byMethod[o.paymentMethod || 'outro'] = (byMethod[o.paymentMethod || 'outro'] || 0) + 1;
        }
        res.json({
            periodo: { de: from || 'inicio', ate: to || 'agora' },
            kpis: {
                receita_total: +totalRevenue.toFixed(2),
                ticket_medio: +(paid.length > 0 ? totalRevenue / paid.length : 0).toFixed(2),
                total_pedidos: allOrders.length,
                pedidos_pagos: paid.length,
                pedidos_pendentes: allOrders.filter(o => o.paymentStatus === 'pendente').length,
                vendas_hoje: todayOrders.length,
                receita_hoje: +todayOrders.reduce((s, o) => s + o.totalPrice, 0).toFixed(2),
            },
            comparacao_periodo_anterior: {
                receita_anterior: +prevRevenue.toFixed(2),
                variacao_receita: prevRevenue > 0 ? `${((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)}%` : 'N/A',
            },
            por_metodo: byMethod,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/customers ──────────────────────────────────────────────────────
app.get('/api/customers', async (req, res) => {
    try {
        const { from, to, limit } = req.query;
        const where = dateFilter(from, to);
        where.paymentStatus = 'pago';
        const orders = await prisma.order.findMany({
            where, select: { email: true, fullName: true, phone: true, totalPrice: true, createdAt: true },
        });
        const customers = {};
        for (const o of orders) {
            const key = o.email || 'sem-email';
            if (!customers[key]) {
                customers[key] = { nome: o.fullName, telefone: o.phone, pedidos: 0, gasto_total: 0, primeira_compra: o.createdAt, ultima_compra: o.createdAt };
            }
            customers[key].pedidos++;
            customers[key].gasto_total += o.totalPrice;
            if (o.createdAt > customers[key].ultima_compra)
                customers[key].ultima_compra = o.createdAt;
            if (o.createdAt < customers[key].primeira_compra)
                customers[key].primeira_compra = o.createdAt;
        }
        const result = Object.entries(customers)
            .map(([email, data]) => ({ email, ...data, gasto_total: +data.gasto_total.toFixed(2), ticket_medio: +(data.gasto_total / data.pedidos).toFixed(2) }))
            .sort((a, b) => b.gasto_total - a.gasto_total)
            .slice(0, parseInt(limit || '50'));
        res.json({ total_clientes_unicos: Object.keys(customers).length, mostrando: result.length, clientes: result });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/conversion-funnel ──────────────────────────────────────────────
app.get('/api/conversion-funnel', async (req, res) => {
    try {
        const { from, to, productId } = req.query;
        const where = dateFilter(from, to);
        if (productId)
            where.productId = productId;
        const orders = await prisma.order.findMany({ where, select: { status: true, paymentStatus: true } });
        const total = orders.length;
        const pago = orders.filter(o => o.paymentStatus === 'pago').length;
        const cancelado = orders.filter(o => o.paymentStatus === 'cancelado').length;
        const enviado = orders.filter(o => o.status === 'enviado').length;
        res.json({
            funil: { total_pedidos: total, pendentes: orders.filter(o => o.paymentStatus === 'pendente').length, pagos: pago, cancelados: cancelado, enviados: enviado },
            taxas: {
                conversao_pagamento: total > 0 ? `${(pago / total * 100).toFixed(1)}%` : 'N/A',
                taxa_cancelamento: total > 0 ? `${(cancelado / total * 100).toFixed(1)}%` : 'N/A',
                taxa_envio: pago > 0 ? `${(enviado / pago * 100).toFixed(1)}%` : 'N/A',
            },
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET /api/email-logs ─────────────────────────────────────────────────────
app.get('/api/email-logs', async (req, res) => {
    try {
        const { from, to, type, status, limit } = req.query;
        const where = {};
        if (from || to) {
            where.sentAt = {};
            if (from)
                where.sentAt.gte = new Date(from);
            if (to)
                where.sentAt.lte = new Date(to + 'T23:59:59');
        }
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        const logs = await prisma.emailLog.findMany({
            where,
            include: { order: { select: { id: true, fullName: true, email: true } } },
            orderBy: { sentAt: 'desc' },
            take: parseInt(limit || '50'),
        });
        res.json({
            total: logs.length,
            logs: logs.map(l => ({ id: l.id, tipo: l.type, status: l.status, erro: l.error, pedido_id: l.orderId, cliente: l.order.fullName, email: l.order.email, enviado_em: l.sentAt })),
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3100', 10);
app.listen(PORT, () => {
    console.log(`[hermes] REST API listening on http://localhost:${PORT}/api`);
});
//# sourceMappingURL=http.js.map