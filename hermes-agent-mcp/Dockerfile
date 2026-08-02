FROM node:22-alpine AS builder

WORKDIR /app
COPY hermes-agent-mcp/package.json hermes-agent-mcp/package-lock.json ./
RUN npm ci
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npx prisma@6 generate --schema=./prisma/schema.prisma
COPY hermes-agent-mcp/tsconfig.json ./
COPY hermes-agent-mcp/src/ ./src/
RUN npm run build

FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY hermes-agent-mcp/package.json ./

ENV NODE_ENV=production
ENV PORT=3100

EXPOSE 3100

CMD ["node", "dist/http.js"]
