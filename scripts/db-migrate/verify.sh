#!/usr/bin/env bash
# Compara a contagem de linhas das tabelas principais entre o banco antigo e o novo.
# Uso: ./verify.sh "postgresql://.../old" "postgresql://.../new"
set -euo pipefail

OLD_DB_URL="${1:-}"
NEW_DB_URL="${2:-}"

if [ -z "$OLD_DB_URL" ] || [ -z "$NEW_DB_URL" ]; then
  echo "Uso: $0 <OLD_DATABASE_URL> <NEW_DATABASE_URL>"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql não encontrado. Instale o cliente do Postgres (postgresql-client)."
  exit 1
fi

# Tabelas do prisma/schema.prisma (ajuste se o schema mudar)
TABLES=(
  "Order"
  "Product"
  "OrderBump"
  "customization_settings"
  "PushSubscription"
  "marketing_pixels"
  "product_pixels"
  "products"
  "push_subscriptions"
  "sales"
  "shipping_rules"
  "EmailTemplate"
  "EmailLog"
  "FinancialRecord"
  "ErrorLog"
)

count_rows() {
  local url="$1" table="$2"
  psql "$url" -tAc "select count(*) from \"$table\"" 2>/dev/null || echo "ERRO"
}

printf "%-28s %12s %12s %s\n" "TABELA" "ANTIGO" "NOVO" "STATUS"
printf "%-28s %12s %12s %s\n" "------" "------" "----" "------"

MISMATCH=0
for t in "${TABLES[@]}"; do
  old_count="$(count_rows "$OLD_DB_URL" "$t")"
  new_count="$(count_rows "$NEW_DB_URL" "$t")"

  if [ "$old_count" = "$new_count" ]; then
    status="OK"
  else
    status="DIVERGENTE"
    MISMATCH=1
  fi
  printf "%-28s %12s %12s %s\n" "$t" "$old_count" "$new_count" "$status"
done

echo ""
if [ "$MISMATCH" -eq 0 ]; then
  echo "Todas as tabelas batem. Migração parece completa."
else
  echo "Existem divergências acima — não aponte a aplicação para o banco novo ainda."
fi
