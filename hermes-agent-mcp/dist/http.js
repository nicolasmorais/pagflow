#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { createServer } from './server.js';
const app = express();
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'mcp-session-id'],
    exposedHeaders: ['mcp-session-id'],
}));
const transports = {};
// POST /mcp — handle MCP requests
app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    try {
        let transport;
        if (sessionId && transports[sessionId]) {
            transport = transports[sessionId];
        }
        else if (!sessionId && isInitializeRequest(req.body)) {
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (sid) => {
                    console.log(`[hermes] Session initialized: ${sid}`);
                    transports[sid] = transport;
                },
            });
            transport.onclose = () => {
                const sid = transport.sessionId;
                if (sid && transports[sid]) {
                    console.log(`[hermes] Session closed: ${sid}`);
                    delete transports[sid];
                }
            };
            const server = createServer();
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
            return;
        }
        else {
            res.status(400).json({
                jsonrpc: '2.0',
                error: { code: -32000, message: 'Bad Request: No valid session ID' },
                id: null,
            });
            return;
        }
        await transport.handleRequest(req, res, req.body);
    }
    catch (error) {
        console.error('[hermes] Error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: { code: -32603, message: 'Internal server error' },
                id: null,
            });
        }
    }
});
// GET /mcp — SSE stream for server-to-client messages
app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }
    await transports[sessionId].handleRequest(req, res);
});
// DELETE /mcp — session termination
app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }
    try {
        await transports[sessionId].handleRequest(req, res);
    }
    catch (error) {
        console.error('[hermes] Error terminating session:', error);
        if (!res.headersSent) {
            res.status(500).send('Error processing session termination');
        }
    }
});
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', name: 'hermes-pagflow', version: '1.0.0', sessions: Object.keys(transports).length });
});
const PORT = parseInt(process.env.PORT || '3100', 10);
app.listen(PORT, () => {
    console.log(`[hermes] MCP HTTP Server listening on http://localhost:${PORT}/mcp`);
});
process.on('SIGINT', async () => {
    console.log('[hermes] Shutting down...');
    for (const sid in transports) {
        try {
            await transports[sid].close();
            delete transports[sid];
        }
        catch { }
    }
    process.exit(0);
});
//# sourceMappingURL=http.js.map