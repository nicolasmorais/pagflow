# Migração do banco para o novo servidor

O app usa Postgres externo (não roda dentro do container — veja `DATABASE_URL` no `.env`).
Trocar de servidor de aplicação **não afeta o banco** a menos que o Postgres também esteja
mudando de host.

## Caso A — Postgres continua no mesmo lugar

Só a aplicação muda de servidor. Não precisa copiar nada: configure a mesma
`DATABASE_URL` no `.env` do novo servidor e suba a aplicação lá. Nenhum dado é tocado.

## Caso B — Postgres também vai migrar (nosso caso)

Já rodada em 2026-08-31, banco antigo (`46.224.198.180:5445`) → banco novo
(`142.132.236.254:5450`). Ferramenta usada: `run-migration.mjs` (Node, usa o
pacote `pg` que já é dependência do projeto — não precisa instalar `pg_dump`).

### O que o script faz

1. Detecta a chave primária real de cada tabela (via `information_schema`).
2. Recria as tabelas "legadas" que existem no banco antigo mas não têm model
   Prisma (`analytics_events`, `back_redirect_events`, `custom_advertorials`,
   `page_views`, `pixels`, `popup_interactions`, `routes`, `settings`, `visits`).
3. Copia os dados de **todas** as tabelas com UPSERT (`ON CONFLICT ... DO
   UPDATE`) — cobre tanto linhas novas quanto linhas que mudaram desde a
   última execução (ex: pedido que virou "pago" depois da primeira cópia).
4. Confere, tabela por tabela, um checksum de conteúdo via `to_jsonb(t)`
   (normalizado por nome de coluna — imune a diferença de ordem física das
   colunas entre banco antigo/novo) e a contagem de linhas.
5. Preserva timestamps com precisão total (sem truncar microssegundos, que é
   o que o driver `pg` faz por padrão ao converter para `Date` do JS).

### Rodar (pré-requisito: `prisma migrate deploy` + `prisma db push` já
### aplicados no banco novo para criar o schema — ver histórico do projeto)

```bash
OLD_DB_URL="postgresql://.../HOST_ANTIGO:5445/postgres" \
NEW_DB_URL="postgresql://.../HOST_NOVO:5450/postgres" \
node scripts/db-migrate/run-migration.mjs
```

Só termina com sucesso (exit 0) quando **todas** as tabelas dão "IDÊNTICO".
Se der "DIVERGENTE" em alguma, não aponte a aplicação para o banco novo —
investigue antes (rode de novo; se persistir, comparar `to_jsonb(t)` linha a
linha para achar a causa, como já foi feito aqui).

**Idempotente e seguro de rodar várias vezes** — é justamente assim que se
garante zero perda: o banco antigo continua recebendo pedidos em tempo real
até o corte, então o procedimento de corte é:

1. Rode `run-migration.mjs` normalmente (feito).
2. Na hora de trocar o `DATABASE_URL` em produção, rode o script **mais uma
   vez** imediatamente antes (pega qualquer pedido/atualização que tenha
   entrado nesse meio-tempo).
3. Só depois de ver "100% idêntico" nessa última rodada, troque o
   `DATABASE_URL` do servidor novo e reinicie a aplicação.

### Alternativa com `pg_dump`/`pg_restore`

Se preferir a ferramenta nativa do Postgres em vez do script Node (ex: banco
muito grande, ou quer um arquivo de backup portátil), os scripts `dump.sh`,
`restore.sh` e `verify.sh` nesta pasta fazem o mesmo fluxo via `pg_dump` —
precisam do pacote `postgresql-client` instalado (`apt-get install
postgresql-client` / `apk add postgresql-client`).

## Descoberta importante durante a migração

`FinancialRecord` e `ErrorLog` existem no `schema.prisma` mas **não têm
migration** em `prisma/migrations/` — foram criadas no banco antigo via
`prisma db push` direto. Isso significa que `prisma migrate deploy` sozinho
NÃO recria essas duas tabelas em um banco novo; é preciso rodar `prisma db
push` também (ou gerar a migration que falta). Vale corrigir isso gerando uma
migration formal, senão o problema se repete no próximo ambiente novo.

## Uploads / arquivos

Arquivos enviados (produtos, logos) vão para S3 (`S3_ENDPOINT`/`S3_BUCKET` no
`.env`), não ficam no disco do servidor — não precisam ser migrados junto com
o banco.
