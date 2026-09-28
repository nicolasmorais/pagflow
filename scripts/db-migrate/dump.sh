#!/usr/bin/env bash
# Faz um backup completo (schema + dados) do banco Postgres antigo.
# Uso: ./dump.sh "postgresql://user:senha@host:porta/banco"
set -euo pipefail

OLD_DB_URL="${1:-${DATABASE_URL:-}}"
if [ -z "$OLD_DB_URL" ]; then
  echo "Uso: $0 <OLD_DATABASE_URL>"
  echo "  (ou exporte DATABASE_URL antes de rodar)"
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump não encontrado. Instale o cliente do Postgres:"
  echo "  Debian/Ubuntu: sudo apt-get install -y postgresql-client"
  echo "  Alpine:        apk add --no-cache postgresql-client"
  exit 1
fi

OUT_DIR="$(dirname "$0")/backups"
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
DUMP_FILE="$OUT_DIR/pagflow_${STAMP}.dump"

echo "==> Fazendo dump de $OLD_DB_URL"
echo "    destino: $DUMP_FILE"

# --format=custom: formato binário compactado, permite restauração seletiva
# --no-owner --no-acl: evita conflito de roles/permissões entre servidores diferentes
pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$DUMP_FILE" \
  "$OLD_DB_URL"

echo "==> Backup concluído: $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"
echo ""
echo "Este arquivo contém TODOS os dados (pedidos, clientes, financeiro)."
echo "Guarde em local seguro e apague depois de confirmar a migração."
