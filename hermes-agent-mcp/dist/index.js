#!/usr/bin/env node
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
    const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
    for (const line of env.split('\n')) {
        const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
        if (m)
            process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
}
catch { /* .env optional */ }
async function main() {
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const { createServer } = await import('./server.js');
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Hermes Agent MCP Server rodando via stdio');
}
main().catch(console.error);
//# sourceMappingURL=index.js.map