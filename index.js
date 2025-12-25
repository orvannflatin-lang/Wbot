import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('[SERVER] Starting with Env:', {
    PORT: process.env.PORT,
    SUPABASE_URL: process.env.SUPABASE_URL ? '✅ PRESENT' : '❌ MISSING (Local Mode)'
});

// Import after dotenv
let startWhatsAppSession, getSession, getSessionStatus, requestPairingCode, stopWhatsAppSession;
try {
    const whatsapp = await import('./lib/whatsapp.js');
    startWhatsAppSession = whatsapp.startWhatsAppSession;
    getSession = whatsapp.getSession;

    getSessionStatus = whatsapp.getSessionStatus;
    // Add new imports
    const getSessionQR = whatsapp.getSessionQR;
    const getSessionPairingCode = whatsapp.getSessionPairingCode;
    requestPairingCode = whatsapp.requestPairingCode;
    stopWhatsAppSession = whatsapp.stopWhatsAppSession;
    console.log('[SERVER] whatsapp.js imported successfully');
} catch (err) {
    console.error('[SERVER] Failed to import whatsapp.js:', err);
    process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Start scheduler after io is defined
import('./lib/whatsapp.js').then(w => {
    if (w.startScheduler) w.startScheduler(io);
});

app.use(cors());
app.use(express.json());

// --- SECURITY MIDDLEWARE ---
const API_SECRET = process.env.API_SECRET || 'CHANGE_ME_IN_ENV';
if (API_SECRET === 'CHANGE_ME_IN_ENV') {
    console.warn('[SECURITY] ⚠️ WARNING: API_SECRET is not set! Your bot endpoints are not fully secured.');
}

const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    // Allow internal communication if needed, but preferably enforce key
    if (!apiKey || apiKey !== API_SECRET) {
        return res.status(403).json({ error: '⛔ Unauthorized: Invalid or missing API Key' });
    }
    next();
};

// Protect Sensitive Endpoints
app.post('/api/session/start', authMiddleware, async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    const existing = getSession(sessionId);
    const status = getSessionStatus(sessionId);

    // If we are in QR mode or Connected, just return status
    if (existing && (status === 'connected' || status === 'qr')) {
        return res.json({ message: 'Session active', status });
    }
    try {
        await startWhatsAppSession(sessionId, io);
        res.json({ message: 'Session initialization started' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

app.post('/api/session/stop', authMiddleware, async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    try {
        const success = await stopWhatsAppSession(sessionId);
        res.json({ success, message: success ? 'Session stopped and cleared' : 'Session not found or already stopped' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to stop session' });
    }
});

// Status Check Route
app.get('/api/session/status/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const status = getSessionStatus(sessionId);
    res.json({
        connected: status === 'connected',
        status: status
    });
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-session', async (sessionId) => {
        socket.join(sessionId);
        console.log(`Socket ${socket.id} joined session room ${sessionId}`);

        // CHECK: If session has a stored QR or Pairing Code, emit it immediately
        // This fixes the issue where refreshing the page loses the QR/Code
        try {
            // Re-import to ensure we have access to functions if they weren't top-level (module scope issue fix)
            const w = await import('./lib/whatsapp.js');
            const savedQR = w.getSessionQR(sessionId);
            const savedCode = w.getSessionPairingCode(sessionId);

            if (savedQR) {
                console.log(`[SERVER] Re-emitting stored QR for ${sessionId}`);
                socket.emit('qr', { sessionId, qr: savedQR });
            }

            if (savedCode) {
                console.log(`[SERVER] Re-emitting stored Pairing Code for ${sessionId}`);
                socket.emit('pairing-code', { code: savedCode });
            }
        } catch (e) {
            console.error('Error re-emitting saved state:', e);
        }
    });
    socket.on('request-pairing-code', async ({ sessionId, phoneNumber }) => {
        try {
            const code = await requestPairingCode(sessionId, phoneNumber);
            socket.emit('pairing-code', { code });
        } catch (error) {
            console.error('Pairing code error:', error);
            socket.emit('error', { message: 'Failed to generate code' });
        }
    });
});

app.post('/api/contacts/sync', authMiddleware, async (req, res) => {
    const { sessionId } = req.body;
    const { getSession } = await import('./lib/whatsapp.js');
    const sock = getSession(sessionId);
    if (!sock) return res.status(404).json({ error: 'Session not active' });

    try {
        await sock.syncAllContacts();
        res.json({ success: true, message: 'Sync triggered' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
    console.log(`[SERVER] Running on port ${PORT}`);

    // Auto-restart all existing sessions
    try {
        const { initAllSessions, startWhatsAppSession } = await import('./lib/whatsapp.js');
        await initAllSessions(io);

        // ONLY AUTO-START IF SESSION_ID IS PROVIDED (user has already scanned QR on dashboard)
        if (process.env.SESSION_ID && process.env.OWNER_ID) {
            const defaultSessionId = process.env.OWNER_ID;
            console.log(`[SERVER] 🔄 SESSION_ID detected - attempting to restore session: ${defaultSessionId}`);
            await startWhatsAppSession(defaultSessionId, io);
        } else {
            console.log(`[SERVER] ℹ️  No SESSION_ID provided - bot will wait for dashboard connection`);
            console.log(`[SERVER] 📌 Users should scan QR on dashboard first, then add SESSION_ID to Render`);
        }
    } catch (err) {
        console.error('[SERVER] Failed to auto-initialize sessions:', err);
    }
});
