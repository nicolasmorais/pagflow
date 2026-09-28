# Hermes Agent MCP - PagFlow

MCP Server para consultas de vendas, pedidos, produtos e financeiro do PagFlow.

## Tools Disponíveis

| Tool | Descrição |
|------|-----------|
| `get_sales_summary` | Resumo agregado de vendas (receita, ticket médio, por método) |
| `get_orders` | Lista pedidos com filtros (data, status, produto, email) |
| `get_order_detail` | Detalhes completos de um pedido específico |
| `search_orders` | Busca por nome, email, CPF, payment ID ou tracking code |
| `get_products` | Lista produtos com preços, custos e contagem de vendas |
| `get_top_products` | Ranking dos produtos mais vendidos |
| `get_sales_by_period` | Vendas agrupadas por dia/semana/mês (para gráficos) |
| `get_utm_performance` | Performance de campanhas UTM |
| `get_financial_records` | Registros financeiros (receitas e despesas) |
| `get_dashboard_kpis` | KPIs do dashboard com comparação de período |
| `get_customers` | Clientes únicos com total de pedidos e gasto |
| `get_conversion_funnel` | Funil de conversão (pendente → pago → enviado) |
| `get_sales_table` | Dados da tabela sales legada |
| `get_email_logs` | Logs de e-mails enviados |

## Setup

### 1. Instalar dependências

```bash
cd hermes-agent-mcp
npm install
```

### 2. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/pagflow
```

### 3. Gerar Prisma Client

```bash
npx prisma generate --schema=../prisma/schema.prisma
```

### 4. Build

```bash
npm run build
```

## Configuração no Claude Code / Cursor / Windsurf

Adicione ao seu `~/.claude/settings.json` ou configuração do MCP:

```json
{
  "mcpServers": {
    "hermes-pagflow": {
      "command": "node",
      "args": ["C:/Users/Administrator/Documents/apps novos - antigravity/pagflow/hermes-agent-mcp/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/pagflow"
      }
    }
  }
}
```

Ou para desenvolvimento (sem build):

```json
{
  "mcpServers": {
    "hermes-pagflow": {
      "command": "npx",
      "args": ["tsx", "C:/Users/Administrator/Documents/apps novos - antigravity/pagflow/hermes-agent-mcp/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/pagflow"
      }
    }
  }
}
```

## Exemplos de Uso

Pergunte ao agente:

- "Quantas vendas tivemos hoje?"
- "Qual o ticket médio dos últimos 30 dias?"
- "Quais são os produtos mais vendidos?"
- "Mostre o funil de conversão da semana"
- "Busque pedidos do email joao@email.com"
- "Como estão as campanhas UTM do mês?"
- "Qual o lucro líquido considerando receitas e despesas?"
- "Quais clientes são recorrentes?"
