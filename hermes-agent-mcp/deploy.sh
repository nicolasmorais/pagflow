#!/bin/bash
set -e

echo "=== Hermes API - Deploy ==="

# 1. Instalar Docker se não tiver
if ! command -v docker &> /dev/null; then
    echo "[1/6] Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "[1/6] Docker já instalado"
fi

# 2. Instalar Docker Compose se não tiver
if ! command -v docker compose &> /dev/null; then
    echo "[2/6] Instalando Docker Compose..."
    apt-get install -y docker-compose-plugin 2>/dev/null || yum install -y docker-compose-plugin 2>/dev/null
else
    echo "[2/6] Docker Compose já instalado"
fi

# 3. Clonar ou atualizar repo
echo "[3/6] Preparando projeto..."
cd /opt
if [ -d "pagflow" ]; then
    cd pagflow
    git pull origin main
else
    git clone https://github.com/nicolasmorais/pagflow.git
    cd pagflow
fi
cd hermes-agent-mcp

# 4. Configurar .env
if [ ! -f ".env" ]; then
    echo ""
    echo "=== Configure o .env ==="
    echo "Cole a DATABASE_URL do PostgreSQL (ex: postgresql://user:pass@host:5432/pagflow):"
    read -r DB_URL
    echo ""
    echo "Cole a API Key (ou pressione Enter para gerar uma):"
    read -r API_KEY
    if [ -z "$API_KEY" ]; then
        API_KEY=$(openssl rand -hex 32)
        echo "API Key gerada: $API_KEY"
    fi

    cat > .env << EOF
DATABASE_URL=$DB_URL
API_KEY=$API_KEY
PORT=3100
EOF
    echo ".env criado com sucesso"
else
    echo "[4/6] .env já existe"
fi

# 5. Build e start
echo "[5/6] Build e start do container..."
docker compose down 2>/dev/null || true
docker compose up -d --build

# 6. Instalar e configurar Nginx + SSL
echo "[6/6] Configurando Nginx + SSL..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx certbot python3-certbot-nginx 2>/dev/null || yum install -y nginx certbot python3-certbot-nginx 2>/dev/null
fi

# Configurar Nginx
cat > /etc/nginx/sites-available/mcp.elabela.store << 'NGINX'
server {
    server_name mcp.elabela.store;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/mcp.elabela.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.elabela.store/privkey.pem;
}

server {
    if ($host = mcp.elabela.store) {
        return 301 https://$host$request_uri;
    }
    server_name mcp.elabela.store;
    listen 80;
    return 404;
}
NGINX

# Ativar site
ln -sf /etc/nginx/sites-available/mcp.elabela.store /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Gerar SSL
certbot --nginx -d mcp.elabela.store --non-interactive --agree-tos --email admin@elabela.store || true

# Testar
echo ""
echo "=== Testando API..."
sleep 2
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/api/health)
if [ "$RESPONSE" = "200" ]; then
    echo "API rodando com sucesso!"
else
    echo "API retornou status $RESPONSE - verifique os logs: docker compose logs"
fi

echo ""
echo "=== Deploy concluído! ==="
echo "URL: https://mcp.elabela.store/api"
echo "Health: https://mcp.elabela.store/api/health"
echo ""
echo "API Key: $(grep API_KEY .env | cut -d= -f2)"
echo ""
echo "Testar:"
echo "  curl -H 'x-api-key: SUA_KEY' https://mcp.elabela.store/api/health"
