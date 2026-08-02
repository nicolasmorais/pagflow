import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from './prisma.js';
export function createServer() {
    const server = new McpServer({
        name: 'hermes-pagflow',
        version: '1.0.0',
    });
    // ─── Helper: date range filter ───────────────────────────────────────────────
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
    function dateFilterSales(from, to) {
        const where = {};
        if (from || to) {
            where.created_at = {};
            if (from)
                where.created_at.gte = new Date(from);
            if (to)
                where.created_at.lte = new Date(to + 'T23:59:59');
        }
        return where;
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_sales_summary
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_sales_summary', 'Resumo de vendas com métricas agregadas (total, ticket médio, por status, por método de pagamento). Use para entender o desempenho geral de vendas.', {
        from: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
        to: z.string().optional().describe('Data final (YYYY-MM-DD)'),
        productId: z.string().optional().describe('Filtrar por ID do produto'),
    }, async ({ from, to, productId }) => {
        const where = dateFilter(from, to);
        if (productId)
            where.productId = productId;
        const orders = await prisma.order.findMany({
            where,
            select: {
                totalPrice: true,
                paymentStatus: true,
                paymentMethod: true,
                status: true,
                hasBump: true,
                createdAt: true,
            },
        });
        const total = orders.length;
        const paid = orders.filter(o => o.paymentStatus === 'pago');
        const pending = orders.filter(o => o.paymentStatus === 'pendente');
        const cancelled = orders.filter(o => o.paymentStatus === 'cancelado');
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
        const bumpsCount = paid.filter(o => o.hasBump).length;
        const bumpRate = paid.length > 0 ? (bumpsCount / paid.length * 100).toFixed(1) : '0';
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        periodo: { de: from || 'inicio', ate: to || 'agora' },
                        total_pedidos: total,
                        pagos: paid.length,
                        pendentes: pending.length,
                        cancelados: cancelled.length,
                        receita_total: +totalRevenue.toFixed(2),
                        ticket_medio: +avgTicket.toFixed(2),
                        taxa_bump: `${bumpRate}%`,
                        por_metodo: byMethod,
                    }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_orders
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_orders', 'Lista pedidos com filtros. Retorna dados do cliente, produto, pagamento, rastreamento e UTM.', {
        from: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
        to: z.string().optional().describe('Data final (YYYY-MM-DD)'),
        status: z.string().optional().describe('Status do pedido (pendente, pago, enviado, etc)'),
        paymentStatus: z.string().optional().describe('Status do pagamento (pago, pendente, cancelado)'),
        paymentMethod: z.string().optional().describe('Método de pagamento (pix, credit_card, boleto)'),
        productId: z.string().optional().describe('ID do produto'),
        email: z.string().optional().describe('Email do cliente'),
        limit: z.number().optional().default(50).describe('Máximo de resultados (default: 50)'),
        offset: z.number().optional().default(0).describe('Offset para paginação'),
    }, async ({ from, to, status, paymentStatus, paymentMethod, productId, email, limit, offset }) => {
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
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: { product: { select: { name: true, price: true } } },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.order.count({ where }),
        ]);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        total,
                        mostrando: orders.length,
                        offset,
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
                    }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_order_detail
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_order_detail', 'Detalhes completos de um pedido específico, incluindo dados do cliente, endereço, produto, bumps, pagamento e logs de e-mail.', {
        orderId: z.string().describe('ID do pedido'),
    }, async ({ orderId }) => {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                product: true,
                emailLogs: true,
            },
        });
        if (!order) {
            return { content: [{ type: 'text', text: 'Pedido não encontrado.' }] };
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        id: order.id,
                        cliente: {
                            nome: order.fullName,
                            email: order.email,
                            telefone: order.phone,
                            cpf: order.cpf,
                        },
                        endereco: {
                            cep: order.cep,
                            rua: order.rua,
                            numero: order.numero,
                            complemento: order.complemento,
                            bairro: order.bairro,
                            cidade: order.cidade,
                            estado: order.estado,
                            referencia: order.referencia,
                        },
                        produto: order.product ? {
                            id: order.product.id,
                            nome: order.product.name,
                            preco: order.product.price,
                            loja: order.product.storeName,
                        } : null,
                        pedido: {
                            status: order.status,
                            valor_total: order.totalPrice,
                            frete: order.shippingPrice,
                            bump: order.hasBump,
                            bumps_selecionados: order.selectedBumps,
                        },
                        pagamento: {
                            status: order.paymentStatus,
                            metodo: order.paymentMethod,
                            parcelas: order.installments,
                            valor_parcela: order.installmentAmount,
                            bandeira: order.cardBrand,
                            liquido: order.netReceived,
                            mp_payment_id: order.mpPaymentId,
                        },
                        rastreio: {
                            codigo: order.trackingCode,
                            url: order.trackingUrl,
                            destinatario: order.recipient,
                        },
                        utm: {
                            source: order.utmSource,
                            medium: order.utmMedium,
                            campaign: order.utmCampaign,
                            term: order.utmTerm,
                            content: order.utmContent,
                            placement: order.utmPlacement,
                            id: order.utmId,
                            creative_name: order.utmCreativeName,
                        },
                        emails: order.emailLogs.map(e => ({
                            tipo: e.type,
                            status: e.status,
                            erro: e.error,
                            enviado_em: e.sentAt,
                        })),
                        criado_em: order.createdAt,
                        atualizado_em: order.updatedAt,
                    }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_products
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_products', 'Lista todos os produtos com preços, custos, comissão e contagem de vendas.', {}, async () => {
        const products = await prisma.product.findMany({
            include: {
                _count: { select: { orders: true } },
            },
            orderBy: { name: 'asc' },
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(products.map(p => ({
                        id: p.id,
                        nome: p.name,
                        preco: p.price,
                        custo: p.cost,
                        comissao: p.commission,
                        loja: p.storeName,
                        digital: p.isDigital,
                        total_vendas: p._count.orders,
                        receita_estimada: +(p.price * p._count.orders).toFixed(2),
                    })), null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_top_products
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_top_products', 'Ranking dos produtos mais vendidos com receita, ticket médio e taxa de conversão.', {
        from: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
        to: z.string().optional().describe('Data final (YYYY-MM-DD)'),
        limit: z.number().optional().default(10).describe('Quantos produtos retornar'),
    }, async ({ from, to, limit }) => {
        const where = dateFilter(from, to);
        where.paymentStatus = 'pago';
        const orders = await prisma.order.findMany({
            where,
            select: { productId: true, totalPrice: true },
        });
        const grouped = {};
        for (const o of orders) {
            const pid = o.productId || 'sem-produto';
            if (!grouped[pid])
                grouped[pid] = { count: 0, revenue: 0 };
            grouped[pid].count++;
            grouped[pid].revenue += o.totalPrice;
        }
        const products = await prisma.product.findMany({
            select: { id: true, name: true, price: true },
        });
        const nameMap = Object.fromEntries(products.map(p => [p.id, p.name]));
        const ranking = Object.entries(grouped)
            .map(([pid, data]) => ({
            produto: nameMap[pid] || pid,
            produto_id: pid,
            vendas: data.count,
            receita: +data.revenue.toFixed(2),
            ticket_medio: +(data.revenue / data.count).toFixed(2),
        }))
            .sort((a, b) => b.receita - a.receita)
            .slice(0, limit);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({ ranking }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_sales_by_period
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_sales_by_period', 'Vendas agrupadas por dia, semana ou mês. Útil para gráficos de tendência.', {
        from: z.string().describe('Data inicial (YYYY-MM-DD)'),
        to: z.string().describe('Data final (YYYY-MM-DD)'),
        groupBy: z.enum(['day', 'week', 'month']).optional().default('day').describe('Agrupar por dia, semana ou mês'),
        productId: z.string().optional().describe('Filtrar por produto'),
    }, async ({ from, to, groupBy, productId }) => {
        const where = dateFilter(from, to);
        where.paymentStatus = 'pago';
        if (productId)
            where.productId = productId;
        const orders = await prisma.order.findMany({
            where,
            select: { createdAt: true, totalPrice: true },
            orderBy: { createdAt: 'asc' },
        });
        const grouped = {};
        for (const o of orders) {
            let key;
            const d = new Date(o.createdAt);
            if (groupBy === 'day') {
                key = d.toISOString().slice(0, 10);
            }
            else if (groupBy === 'week') {
                const start = new Date(d);
                start.setDate(d.getDate() - d.getDay());
                key = start.toISOString().slice(0, 10) + ' (semana)';
            }
            else {
                key = d.toISOString().slice(0, 7);
            }
            if (!grouped[key])
                grouped[key] = { count: 0, revenue: 0 };
            grouped[key].count++;
            grouped[key].revenue += o.totalPrice;
        }
        const series = Object.entries(grouped).map(([period, data]) => ({
            periodo: period,
            vendas: data.count,
            receita: +data.revenue.toFixed(2),
        }));
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({ agrupamento: groupBy, series }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_utm_performance
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_utm_performance', 'Performance de campanhas UTM (source, medium, campaign). Mostra vendas, receita e ticket médio por campanha.', {
        from: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
        to: z.string().optional().describe('Data final (YYYY-MM-DD)'),
        groupBy: z.enum(['source', 'medium', 'campaign']).optional().default('source').describe('Agrupar por source, medium ou campaign'),
    }, async ({ from, to, groupBy }) => {
        const where = dateFilter(from, to);
        where.paymentStatus = 'pago';
        const orders = await prisma.order.findMany({
            where,
            select: {
                totalPrice: true,
                utmSource: true,
                utmMedium: true,
                utmCampaign: true,
            },
        });
        const grouped = {};
        for (const o of orders) {
            let key;
            if (groupBy === 'source')
                key = o.utmSource || 'direto';
            else if (groupBy === 'medium')
                key = o.utmMedium || 'direto';
            else
                key = o.utmCampaign || 'direto';
            if (!grouped[key])
                grouped[key] = { count: 0, revenue: 0 };
            grouped[key].count++;
            grouped[key].revenue += o.totalPrice;
        }
        const result = Object.entries(grouped)
            .map(([key, data]) => ({
            [groupBy]: key,
            vendas: data.count,
            receita: +data.revenue.toFixed(2),
            ticket_medio: +(data.revenue / data.count).toFixed(2),
        }))
            .sort((a, b) => b.receita - a.receita);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({ agrupado_por: groupBy, campanhas: result }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_financial_records
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_financial_records', 'Registros financeiros (receitas e despesas). Filtrar por tipo, categoria e período.', {
        from: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
        to: z.string().optional().describe('Data final (YYYY-MM-DD)'),
        type: z.enum(['receita', 'despesa']).optional().describe('Tipo: receita ou despesa'),
        category: z.string().optional().describe('Categoria (marketing, operacional, frete, taxa, outros)'),
    }, async ({ from, to, type, category }) => {
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
        const records = await prisma.financialRecord.findMany({
            where,
            orderBy: { date: 'desc' },
        });
        const totalReceita = records.filter(r => r.type === 'receita').reduce((s, r) => s + r.amount, 0);
        const totalDespesa = records.filter(r => r.type === 'despesa').reduce((s, r) => s + r.amount, 0);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        resumo: {
                            total_receita: +totalReceita.toFixed(2),
                            total_despesa: +totalDespesa.toFixed(2),
                            lucro: +(totalReceita - totalDespesa).toFixed(2),
                        },
                        registros: records.map(r => ({
                            id: r.id,
                            tipo: r.type,
                            categoria: r.category,
                            descricao: r.description,
                            valor: r.amount,
                            data: r.date,
                        })),
                    }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_dashboard_kpis
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_dashboard_kpis', 'KPIs do dashboard: receita total, ticket médio, taxa de conversão, vendas por status, comparação com período anterior.', {
        from: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
        to: z.string().optional().describe('Data final (YYYY-MM-DD)'),
    }, async ({ from, to }) => {
        const where = dateFilter(from, to);
        const allOrders = await prisma.order.findMany({
            where,
            select: {
                totalPrice: true,
                paymentStatus: true,
                paymentMethod: true,
                createdAt: true,
            },
        });
        const paid = allOrders.filter(o => o.paymentStatus === 'pago');
        const totalRevenue = paid.reduce((s, o) => s + o.totalPrice, 0);
        const avgTicket = paid.length > 0 ? totalRevenue / paid.length : 0;
        // Per anterior (mesmo tamanho de período)
        let prevWhere = {};
        if (from && to) {
            const fromD = new Date(from);
            const toD = new Date(to + 'T23:59:59');
            const diff = toD.getTime() - fromD.getTime();
            prevWhere = {
                createdAt: {
                    gte: new Date(fromD.getTime() - diff),
                    lte: fromD,
                },
            };
        }
        const prevOrders = await prisma.order.findMany({
            where: prevWhere,
            select: { totalPrice: true, paymentStatus: true },
        });
        const prevPaid = prevOrders.filter(o => o.paymentStatus === 'pago');
        const prevRevenue = prevPaid.reduce((s, o) => s + o.totalPrice, 0);
        const revenueChange = prevRevenue > 0
            ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)
            : 'N/A';
        // Vendas hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = paid.filter(o => new Date(o.createdAt) >= today);
        // Vendas por método
        const byMethod = {};
        for (const o of paid) {
            const m = o.paymentMethod || 'outro';
            byMethod[m] = (byMethod[m] || 0) + 1;
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        periodo: { de: from || 'inicio', ate: to || 'agora' },
                        kpis: {
                            receita_total: +totalRevenue.toFixed(2),
                            ticket_medio: +avgTicket.toFixed(2),
                            total_pedidos: allOrders.length,
                            pedidos_pagos: paid.length,
                            pedidos_pendentes: allOrders.filter(o => o.paymentStatus === 'pendente').length,
                            vendas_hoje: todayOrders.length,
                            receita_hoje: +todayOrders.reduce((s, o) => s + o.totalPrice, 0).toFixed(2),
                        },
                        comparacao_periodo_anterior: {
                            receita_anterior: +prevRevenue.toFixed(2),
                            variacao_receita: `${revenueChange}%`,
                        },
                        por_metodo: byMethod,
                    }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_customers
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_customers', 'Lista de clientes únicos com total de pedidos e gasto. Útil para identificar clientes recorrentes.', {
        from: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
        to: z.string().optional().describe('Data final (YYYY-MM-DD)'),
        limit: z.number().optional().default(50).describe('Máximo de resultados'),
    }, async ({ from, to, limit }) => {
        const where = dateFilter(from, to);
        where.paymentStatus = 'pago';
        const orders = await prisma.order.findMany({
            where,
            select: {
                email: true,
                fullName: true,
                phone: true,
                totalPrice: true,
                createdAt: true,
            },
        });
        const customers = {};
        for (const o of orders) {
            const key = o.email || 'sem-email';
            if (!customers[key]) {
                customers[key] = {
                    nome: o.fullName || 'N/A',
                    telefone: o.phone || 'N/A',
                    pedidos: 0,
                    gasto_total: 0,
                    primeira_compra: o.createdAt.toISOString(),
                    ultima_compra: o.createdAt.toISOString(),
                };
            }
            customers[key].pedidos++;
            customers[key].gasto_total += o.totalPrice;
            if (o.createdAt.toISOString() > customers[key].ultima_compra) {
                customers[key].ultima_compra = o.createdAt.toISOString();
            }
            if (o.createdAt.toISOString() < customers[key].primeira_compra) {
                customers[key].primeira_compra = o.createdAt.toISOString();
            }
        }
        const result = Object.entries(customers)
            .map(([email, data]) => ({
            email,
            ...data,
            gasto_total: +data.gasto_total.toFixed(2),
            ticket_medio: +(data.gasto_total / data.pedidos).toFixed(2),
        }))
            .sort((a, b) => b.gasto_total - a.gasto_total)
            .slice(0, limit);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        total_clientes_unicos: Object.keys(customers).length,
                        mostrando: result.length,
                        clientes: result,
                    }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_conversion_funnel
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_conversion_funnel', 'Funil de conversão: quantos pedidos em cada estágio (pendente → pago → enviado). Inclui taxa de conversão.', {
        from: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
        to: z.string().optional().describe('Data final (YYYY-MM-DD)'),
        productId: z.string().optional().describe('Filtrar por produto'),
    }, async ({ from, to, productId }) => {
        const where = dateFilter(from, to);
        if (productId)
            where.productId = productId;
        const orders = await prisma.order.findMany({
            where,
            select: { status: true, paymentStatus: true },
        });
        const total = orders.length;
        const pendente = orders.filter(o => o.paymentStatus === 'pendente').length;
        const pago = orders.filter(o => o.paymentStatus === 'pago').length;
        const cancelado = orders.filter(o => o.paymentStatus === 'cancelado').length;
        const enviado = orders.filter(o => o.status === 'enviado').length;
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        funil: {
                            total_pedidos: total,
                            pendentes: pendente,
                            pagos: pago,
                            cancelados: cancelado,
                            enviados: enviado,
                        },
                        taxas: {
                            conversao_pagamento: total > 0 ? `${(pago / total * 100).toFixed(1)}%` : 'N/A',
                            taxa_cancelamento: total > 0 ? `${(cancelado / total * 100).toFixed(1)}%` : 'N/A',
                            taxa_envio: pago > 0 ? `${(enviado / pago * 100).toFixed(1)}%` : 'N/A',
                        },
                    }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_sales_table (compatível com a tabela de vendas)
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_sales_table', 'Dados da tabela de vendas (tabela sales do banco). Diferente de orders — esta é a tabela de vendas legada com dados de produto e UTM.', {
        from: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
        to: z.string().optional().describe('Data final (YYYY-MM-DD)'),
        status: z.string().optional().describe('Status da venda'),
        limit: z.number().optional().default(50).describe('Máximo de resultados'),
    }, async ({ from, to, status, limit }) => {
        const where = dateFilterSales(from, to);
        if (status)
            where.status = status;
        const sales = await prisma.sales.findMany({
            where,
            include: { products: { select: { name: true, price: true } } },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        total: sales.length,
                        vendas: sales.map(s => ({
                            id: s.id,
                            cliente: { nome: s.customer_name, email: s.customer_email },
                            produto: s.products?.name || 'N/A',
                            status: s.status,
                            metodo_pagamento: s.payment_method,
                            valor: s.products?.price || 0,
                            utm: { source: s.utm_source, medium: s.utm_medium, campaign: s.utm_campaign },
                            data: s.created_at,
                        })),
                    }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: search_orders
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('search_orders', 'Busca pedidos por nome, email, CPF, ID do pagamento MP ou código de rastreio.', {
        query: z.string().describe('Termo de busca (nome, email, CPF, payment ID, tracking code)'),
        limit: z.number().optional().default(20).describe('Máximo de resultados'),
    }, async ({ query, limit }) => {
        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { fullName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { cpf: { contains: query } },
                    { mpPaymentId: { contains: query } },
                    { trackingCode: { contains: query, mode: 'insensitive' } },
                    { id: { contains: query } },
                ],
            },
            include: { product: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        busca: query,
                        encontrados: orders.length,
                        pedidos: orders.map(o => ({
                            id: o.id,
                            cliente: o.fullName,
                            email: o.email,
                            produto: o.product?.name || 'N/A',
                            valor: o.totalPrice,
                            status: o.status,
                            pagamento: o.paymentStatus,
                            data: o.createdAt,
                        })),
                    }, null, 2),
                }],
        };
    });
    // ═══════════════════════════════════════════════════════════════════════════════
    //  TOOL: get_email_logs
    // ═══════════════════════════════════════════════════════════════════════════════
    server.tool('get_email_logs', 'Logs de e-mails enviados. Mostra quais e-mails foram enviados, status e erros.', {
        from: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
        to: z.string().optional().describe('Data final (YYYY-MM-DD)'),
        type: z.string().optional().describe('Tipo de e-mail (ex: pix_pending, tracking, followup)'),
        status: z.string().optional().describe('Status (sent, failed, etc)'),
        limit: z.number().optional().default(50).describe('Máximo de resultados'),
    }, async ({ from, to, type, status, limit }) => {
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
            include: {
                order: {
                    select: { id: true, fullName: true, email: true },
                },
            },
            orderBy: { sentAt: 'desc' },
            take: limit,
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        total: logs.length,
                        logs: logs.map(l => ({
                            id: l.id,
                            tipo: l.type,
                            status: l.status,
                            erro: l.error,
                            pedido_id: l.orderId,
                            cliente: l.order.fullName,
                            email: l.order.email,
                            enviado_em: l.sentAt,
                        })),
                    }, null, 2),
                }],
        };
    });
    return server;
}
//# sourceMappingURL=server.js.map