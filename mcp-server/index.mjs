#!/usr/bin/env node
/**
 * MCP Server — PagFlow
 * Expõe os dados do banco para o Claude via conector MCP (SDK v1.x).
 * Execução: node mcp-server/index.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega .env manualmente
try {
    const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
    for (const line of env.split('\n')) {
        const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
} catch { /* .env opcional */ }

const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');
const { PrismaClient } = await import('@prisma/client');

const prisma = new PrismaClient();

const server = new Server(
    { name: 'pagflow', version: '1.0.0' },
    { capabilities: { tools: {} } }
);

/* ── Ferramentas disponíveis ── */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'listar_pedidos',
            description: 'Lista pedidos com filtros. Retorna id, nome, email, status, totalPrice, paymentMethod, produto e data.',
            inputSchema: {
                type: 'object',
                properties: {
                    status: { type: 'string', description: 'pendente | processando | enviado | entregue | cancelado' },
                    paymentStatus: { type: 'string', description: 'pago | recusado | aguardando' },
                    paymentMethod: { type: 'string', description: 'pix | credito' },
                    limite: { type: 'number', description: 'Máx. resultados (padrão 50, máx 200)' },
                    pagina: { type: 'number', description: 'Página (padrão 1)' },
                    busca: { type: 'string', description: 'Buscar por nome, e-mail ou CPF' },
                    dataInicio: { type: 'string', description: 'ISO date ex: 2024-01-01' },
                    dataFim: { type: 'string', description: 'ISO date ex: 2024-12-31' },
                },
            },
        },
        {
            name: 'buscar_pedido',
            description: 'Detalhes completos de um pedido pelo ID.',
            inputSchema: {
                type: 'object',
                properties: { id: { type: 'string' } },
                required: ['id'],
            },
        },
        {
            name: 'stats_vendas',
            description: 'Resumo de vendas pagas: total, receita, ticket médio, por método, por produto.',
            inputSchema: {
                type: 'object',
                properties: {
                    dataInicio: { type: 'string' },
                    dataFim: { type: 'string' },
                },
            },
        },
        {
            name: 'listar_produtos',
            description: 'Todos os produtos com preço, custo, order bumps e contagem de pedidos.',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'registros_financeiros',
            description: 'Receitas e despesas manuais registradas (marketing, frete, taxas etc.).',
            inputSchema: {
                type: 'object',
                properties: {
                    tipo: { type: 'string', description: 'receita | despesa' },
                    limite: { type: 'number' },
                },
            },
        },
        {
            name: 'configuracoes',
            description: 'Todas as configurações do checkout (cores, textos, descontos PIX, taxas de cartão, etc.).',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'funil_checkout',
            description: 'Eventos do funil por etapa (visits, etapa1, etapa2, pagamento_iniciado, pedido_criado).',
            inputSchema: {
                type: 'object',
                properties: {
                    dataInicio: { type: 'string' },
                    dataFim: { type: 'string' },
                },
            },
        },
        {
            name: 'erros_recentes',
            description: 'Últimos erros registrados no sistema.',
            inputSchema: {
                type: 'object',
                properties: {
                    nivel: { type: 'string', description: 'error | warning | critical' },
                    limite: { type: 'number' },
                },
            },
        },
    ],
}));

/* ── Execução das ferramentas ── */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
    const err = (msg) => ({ content: [{ type: 'text', text: msg }], isError: true });

    try {
        if (name === 'listar_pedidos') {
            const limite = Math.min(Number(args.limite) || 50, 200);
            const pagina = Math.max(Number(args.pagina) || 1, 1);
            const where = { deletedAt: null };
            if (args.status) where.status = args.status;
            if (args.paymentStatus) where.paymentStatus = args.paymentStatus;
            if (args.paymentMethod) where.paymentMethod = args.paymentMethod;
            if (args.busca) {
                where.OR = [
                    { fullName: { contains: args.busca, mode: 'insensitive' } },
                    { email: { contains: args.busca, mode: 'insensitive' } },
                    { cpf: { contains: args.busca } },
                ];
            }
            if (args.dataInicio || args.dataFim) {
                where.createdAt = {};
                if (args.dataInicio) where.createdAt.gte = new Date(args.dataInicio);
                if (args.dataFim) where.createdAt.lte = new Date(args.dataFim);
            }
            const [pedidos, total] = await Promise.all([
                prisma.order.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    take: limite,
                    skip: (pagina - 1) * limite,
                    select: {
                        id: true, fullName: true, email: true, status: true,
                        paymentStatus: true, paymentMethod: true, totalPrice: true,
                        shippingPrice: true, createdAt: true, paidAt: true,
                        trackingCode: true, cardBrand: true, installments: true,
                        utmSource: true, utmCampaign: true,
                        product: { select: { name: true } },
                    },
                }),
                prisma.order.count({ where }),
            ]);
            return ok({ total, pagina, limite, pedidos });
        }

        if (name === 'buscar_pedido') {
            const pedido = await prisma.order.findUnique({
                where: { id: args.id },
                include: {
                    product: true,
                    emailLogs: { orderBy: { sentAt: 'desc' }, take: 5 },
                },
            });
            return ok(pedido);
        }

        if (name === 'stats_vendas') {
            const where = { deletedAt: null, paymentStatus: 'pago' };
            if (args.dataInicio || args.dataFim) {
                where.paidAt = {};
                if (args.dataInicio) where.paidAt.gte = new Date(args.dataInicio);
                if (args.dataFim) where.paidAt.lte = new Date(args.dataFim);
            }
            const pedidos = await prisma.order.findMany({
                where,
                select: {
                    totalPrice: true, paymentMethod: true,
                    product: { select: { name: true } },
                },
            });
            const receita = pedidos.reduce((s, p) => s + (p.totalPrice || 0), 0);
            const porMetodo = pedidos.reduce((acc, p) => {
                const m = p.paymentMethod || 'desconhecido';
                acc[m] = (acc[m] || 0) + 1;
                return acc;
            }, {});
            const porProduto = pedidos.reduce((acc, p) => {
                const nome = p.product?.name || 'sem produto';
                if (!acc[nome]) acc[nome] = { vendas: 0, receita: 0 };
                acc[nome].vendas++;
                acc[nome].receita = Number(((acc[nome].receita || 0) + (p.totalPrice || 0)).toFixed(2));
                return acc;
            }, {});
            return ok({
                totalVendas: pedidos.length,
                receitaTotal: receita.toFixed(2),
                ticketMedio: pedidos.length ? (receita / pedidos.length).toFixed(2) : '0.00',
                porMetodoPagamento: porMetodo,
                porProduto,
            });
        }

        if (name === 'listar_produtos') {
            const produtos = await prisma.product.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { orders: true } },
                    orderBumps: { select: { id: true, name: true, price: true, isActive: true } },
                },
            });
            return ok(produtos);
        }

        if (name === 'registros_financeiros') {
            const where = {};
            if (args.tipo) where.type = args.tipo;
            const registros = await prisma.financialRecord.findMany({
                where,
                orderBy: { date: 'desc' },
                take: Math.min(Number(args.limite) || 100, 500),
            });
            const resumo = registros.reduce((acc, r) => {
                acc[r.type] = Number(((acc[r.type] || 0) + r.amount).toFixed(2));
                return acc;
            }, {});
            return ok({ resumo, registros });
        }

        if (name === 'configuracoes') {
            const configs = await prisma.customization_settings.findMany({ orderBy: { key: 'asc' } });
            return ok(Object.fromEntries(configs.map(c => [c.key, c.value])));
        }

        if (name === 'funil_checkout') {
            const where = {};
            if (args.dataInicio || args.dataFim) {
                where.createdAt = {};
                if (args.dataInicio) where.createdAt.gte = new Date(args.dataInicio);
                if (args.dataFim) where.createdAt.lte = new Date(args.dataFim);
            }
            const eventos = await prisma.checkoutEvent.groupBy({
                by: ['step'],
                _count: { step: true },
                where,
                orderBy: { _count: { step: 'desc' } },
            });
            return ok(Object.fromEntries(eventos.map(e => [e.step, e._count.step])));
        }

        if (name === 'erros_recentes') {
            const where = {};
            if (args.nivel) where.level = args.nivel;
            const erros = await prisma.errorLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: Math.min(Number(args.limite) || 20, 100),
            });
            return ok(erros);
        }

        return err(`Ferramenta desconhecida: ${name}`);
    } catch (e) {
        return err(`Erro: ${e.message}`);
    }
});

const transport = new StdioServerTransport();
await server.connect(transport);
