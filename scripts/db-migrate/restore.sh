#!/usr/bin/env bash
# Restaura um backup (gerado por dump.sh) no banco Postgres novo.
# Uso: ./restore.sh <arquivo.dump> "postgresql://user:senha@host:porta/banco"
set -euo pipefail

DUMP_FILE="${1:-}"
NEW_DB_URL="${2:-}"

if [ -z "$DUMP_FILE" ] || [ -z "$NEW_DB_URL" ]; then
  echo "Uso: $0 <arquivo.dump> <NEW_DATABASE_URL>"
  exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
  echo "Arquivo não encontrado: $DUMP_FILE"
  exit 1
fi

for cmd in pg_restore psql; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "$cmd não encontrado. Instale o cliente do Postgres:"
    echo "  Debian/Ubuntu: sudo apt-get install -y postgresql-client"
    echo "  Alpine:        apk add --no-cache postgresql-client"
    exit 1
  fi
done

echo "==> Verificando se o banco novo já tem tabelas..."
TABLE_COUNT="$(psql "$NEW_DB_URL" -tAc "select count(*) from information_schema.tables where table_schema='public'")"

if [ "$TABLE_COUNT" != "0" ]; then
  echo "ATENÇÃO: o banco novo já contém $TABLE_COUNT tabela(s)."
  read -r -p "Continuar mesmo assim pode SOBRESCREVER dados existentes. Digite 'sim' para prosseguir: " CONFIRM
  if [ "$CONFIRM" != "sim" ]; then
    echo "Cancelado."
    exit 1
  fi
  CLEAN_FLAG="--clean --if-exists"
else
  CLEAN_FLAG=""
fi

echo "==> Restaurando $DUMP_FILE em $NEW_DB_URL"
pg_restore \
  --no-owner \
  --no-acl \
  $CLEAN_FLAG \
  --dbname="$NEW_DB_URL" \
  "$DUMP_FILE"

echo "==> Restauração concluída. Rode ./verify.sh para conferir os dados."
