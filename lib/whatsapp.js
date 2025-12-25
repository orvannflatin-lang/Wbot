import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    downloadMediaMessage,
    Browsers,
    jidNormalizedUser
} from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import zlib from 'zlib';
import cron from 'node-cron';
import { supabase } from './supabase.js';
import * as downloader from './downloader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = pino({ level: 'silent' });

const sessions = new Map();
const messageStore = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
// Cache for Reply Redirection: { 'owner_msg_id': 'original_sender_jid' }
const replyMap = new NodeCache({ stdTTL: 86400, checkperiod: 3600 }); // 24h retention for replies

// Helper: Extract text from any message type
const getText = (message) => {
    if (!message) return '';
    return message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        message.ephemeralMessage?.message?.conversation ||
        message.ephemeralMessage?.message?.extendedTextMessage?.text ||
        message.buttonsResponseMessage?.selectedButtonId ||
        message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        '';
};

// Helper: Delete session folder
const deleteSessionFolder = (sessionId) => {
    const authFolder = path.join(__dirname, '..', 'auth_sessions', sessionId);
    if (fs.existsSync(authFolder)) {
        try {
            fs.rmSync(authFolder, { recursive: true, force: true });
            console.log(`[WBOT] Deleted session folder for ${sessionId}`);
        } catch (e) { }
    }
};

// Helper: Decode Session ID (Base64) - Supports OVL/WBOT format
// Format: WBOT-MD_V2_<BASE64>
async function decodeSessionId(encodedId, authFolder) {
    if (!encodedId) return false;

    // Extract Base64 part (support OVL, WBOT V2, and WBOT V3)
    let base64Data = encodedId;
    let isCompressed = false;

    if (encodedId.startsWith('WBOT-MD_V3_')) {
        base64Data = encodedId.split('WBOT-MD_V3_')[1];
        isCompressed = true;
    } else if (encodedId.includes('OVL-MD-V2_')) {
        base64Data = encodedId.split('OVL-MD-V2_')[1];
    } else if (encodedId.includes('WBOT-MD_V2_')) {
        base64Data = encodedId.split('WBOT-MD_V2_')[1];
    } else if (encodedId.includes('OVL-MD-V2')) {
        base64Data = encodedId.split('OVL-MD-V2')[1]; // Legacy
    }

    try {
        let creds;
        if (encodedId.startsWith('WBOT-MD_V4_')) {
            // V4: Stateless Short ID -> Fetch from DB
            const sessionUuid = encodedId.split('WBOT-MD_V4_')[1];
            console.log(`[WBOT] 🔄 V4 Restoration: Fetching session dump for ${sessionUuid}...`);

            // 1. Try user_settings (OVL/Auth Users)
            let { data: userSettings, error } = await supabase
                .from('user_settings')
                .select('session_dump')
                .eq('user_id', sessionUuid)
                .single();

            if (userSettings?.session_dump) {
                creds = userSettings.session_dump;
                console.log(`[WBOT] ✅ V4 Session Dump retrieved from user_settings.`);
            } else {
                // 2. Fallback: Try whatsapp_sessions (Standalone/Guest)
                console.log(`[WBOT] ⚠️ Not found in user_settings, trying whatsapp_sessions fallback...`);
                const { data: sessionData, error: sessionError } = await supabase
                    .from('whatsapp_sessions')
                    .select('data')
                    .eq('session_id', sessionUuid)
                    .eq('key', 'session_dump')
                    .single();

                if (sessionData?.data) {
                    creds = sessionData.data;
                    console.log(`[WBOT] ✅ V4 Session Dump retrieved from whatsapp_sessions.`);
                } else {
                    throw new Error("Session dump not found in Supabase (checked both tables).");
                }
            }

            if (!creds) throw new Error("Creds retrieval failed.");
        } else if (isCompressed) {
            const compressedBuffer = Buffer.from(base64Data, 'base64');
            const jsonStr = zlib.unzipSync(compressedBuffer).toString('utf-8');
            creds = JSON.parse(jsonStr);
        } else {
            const jsonStr = Buffer.from(base64Data, 'base64').toString('utf-8');
            creds = JSON.parse(jsonStr);
        }
        if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });

        // Write creds.json
        fs.writeFileSync(path.join(authFolder, 'creds.json'), JSON.stringify(creds, null, 2));
        console.log(`[WBOT] 🔑 Session ID decoded successfully for ${authFolder}`);
        return true;
    } catch (e) {
        console.error(`[WBOT] ❌ Decode Error:`, e.message);
        return false;
    }
}

/**
 * START WHATSAPP SESSION (A to Z Logic)
 */
export const startWhatsAppSession = async (sessionId, io, isReset = false) => {
    try {
        if (!sessionId) return;

        // Cleanup existing
        if (sessions.has(sessionId)) {
            const sess = sessions.get(sessionId);
            if (sess.status === 'connected' && !isReset) return;
            try { sess.sock.end(); } catch (e) { }
            sessions.delete(sessionId);
        }

        const authFolder = path.join(__dirname, '..', 'auth_sessions', sessionId);

        if (isReset) {
            deleteSessionFolder(sessionId);
        }

        // --- SESSION RESTORATION LOGIC ---
        // 1. Check Env Variable (Priority for Render)
        if (process.env.SESSION_ID && !fs.existsSync(path.join(authFolder, 'creds.json'))) {
            console.log(`[WBOT] 🔄 Attempting to restore from ENV SESSION_ID...`);
            await decodeSessionId(process.env.SESSION_ID, authFolder);
        }

        // 2. Check Database Settings (Legacy/Web injection) - OPTIONAL if Supabase configured
        if (supabase && process.env.SUPABASE_URL) {
            try {
                const { data: settings } = await supabase.from('user_settings').select('*').eq('session_id', sessionId).single();
                if (settings?.session_id_ovl && !fs.existsSync(path.join(authFolder, 'creds.json'))) {
                    console.log(`[WBOT] 🔄 Attempting to restore from DB session_id_ovl...`);
                    await decodeSessionId(settings.session_id_ovl, authFolder);
                }
            } catch (dbError) {
                console.log(`[WBOT] ℹ️ Supabase not available or no session found - continuing with local mode`);
            }
        }

        console.log(`[WBOT] 🚀 Initializing session: ${sessionId}`);
        io.to(sessionId).emit('status', { sessionId, status: 'starting' });

        if (!fs.existsSync(authFolder)) {
            fs.mkdirSync(authFolder, { recursive: true });
        }
        const { state, saveCreds } = await useMultiFileAuthState(authFolder);
        const { version } = await fetchLatestBaileysVersion();

        // OVL-Stable WASocket Configuration
        const sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: true, // Visible for user to link safely
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            browser: ['Ubuntu', 'Chrome', '20.0.04'],
            syncFullHistory: true,
            shouldSyncHistoryMessage: () => true,
            markOnlineOnConnect: false, // Stealth by default (prevents 'Online' status on boot)
            receivedPendingNotifications: true,
            getMessage: async () => { return undefined; },
            connectTimeoutMs: 150000,
            defaultQueryTimeoutMs: 150000,
            keepAliveIntervalMs: 10000, // High persistence
            generateHighQualityLinkPreview: true
        });

        sessions.set(sessionId, { sock, status: 'starting', qr: null, pairingCode: null });

        sock.ev.on('creds.update', saveCreds);

        // --- [ GHOST MODE LOGIC ] ---
        sock.ev.on('presence.update', async (presence) => {
            // Fetch global ghost mode
            const settingsId = process.env.OWNER_ID || (sessionId.includes('-') ? sessionId : null);
            if (settingsId) {
                const { data: settings } = await supabase.from('user_settings').select('ghost_mode_global').eq('user_id', settingsId).single();
                if (settings?.ghost_mode_global) return;
            }
        });

        // Connection Handling
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log(`[WBOT] 📱 QR Available for ${sessionId}`);
                // Update session state with QR
                const currentSession = sessions.get(sessionId);
                sessions.set(sessionId, { ...currentSession, sock, status: 'qr', qr });

                io.to(sessionId).emit('qr', { sessionId, qr });
                io.to(sessionId).emit('status', { sessionId, status: 'qr' });
            }

            if (connection === 'open') {
                // Immediate status update to UI
                // Clear QR/Pairing code on connection
                const currentSession = sessions.get(sessionId);
                sessions.set(sessionId, { ...currentSession, sock, status: 'connected', qr: null, pairingCode: null });
                io.to(sessionId).emit('status', { sessionId, status: 'connected' });

                // Wait for sock.user.id to be ready
                const checkReady = setInterval(async () => {
                    if (sock.user?.id) {
                        clearInterval(checkReady);
                        console.log(`[WBOT] ✅ BOT ACTIF: ${sock.user.id}`);

                        const userJid = jidNormalizedUser(sock.user.id);

                        // --- [ SESSION CREDENTIALS MESSAGE ] ---
                        // Always send credentials for Render deployment
                        try {
                            // Delay slightly to ensure file writes/network stability
                            setTimeout(async () => {
                                if (fs.existsSync(path.join(authFolder, 'creds.json'))) {
                                    const credsBuffer = fs.readFileSync(path.join(authFolder, 'creds.json'));
                                    const credsJson = JSON.parse(credsBuffer.toString());

                                    // V4: Generate Session ID (Default to V2 if Supabase fails)
                                    let sessionString = '';
                                    let isV4 = false;

                                    // Get prefix from Supabase if available, otherwise use default
                                    let prefix = '1';
                                    let ownerName = sock.user?.name || sock.user?.notify || 'Moi';

                                    if (supabase && process.env.SUPABASE_URL) {
                                        try {
                                            // 1. Try Upload to user_settings (Preferred)
                                            // We use UPSERT now but check for FK constraint indirectly by catching error
                                            const { error: settingsError } = await supabase.from('user_settings').update({
                                                session_dump: credsJson
                                            }).eq('user_id', sessionId);

                                            // If update failed (row doesn't exist) or we want to be sure, check if it worked
                                            // Actually, 'update' returns no error if row missing, count=0.

                                            // 2. Fallback: Save to whatsapp_sessions (Universal Storage)
                                            // This works for ANY session ID, even without Auth User
                                            const { error: sessionError } = await supabase.from('whatsapp_sessions').upsert({
                                                session_id: sessionId,
                                                key: 'session_dump',
                                                data: credsJson
                                            }, { onConflict: 'session_id,key' });

                                            if (!sessionError) {
                                                console.log('[WBOT] ✅ Session saved to Supabase (whatsapp_sessions fallback)');
                                                sessionString = `WBOT-MD_V4_${sessionId}`;
                                                isV4 = true;

                                                // Try to fetch settings just in case
                                                try {
                                                    const { data: userSettings } = await supabase.from('user_settings').select('*').eq('user_id', sessionId).single();
                                                    prefix = userSettings?.view_once_prefix || '1';
                                                    ownerName = userSettings?.owner_name || ownerName;
                                                } catch (e) { }
                                            } else {
                                                console.error('[WBOT] Supabase Save Failed:', sessionError.message);
                                            }
                                        } catch (dbErr) {
                                            console.log('[WBOT] Supabase error, falling back to V2 session string', dbErr);
                                        }
                                    }

                                    // Fallback to V2 (Base64) if V4 failed or Supabase missing
                                    if (!isV4) {
                                        const encodedCreds = Buffer.from(JSON.stringify(credsJson)).toString('base64');
                                        sessionString = `WBOT-MD_V2_${encodedCreds}`;
                                    }

                                    const caption = `*WBOT CONFIGURATION (Render)*\n\n` +
                                        `Copiez le bloc ci-dessous et collez-le dans "Add from .env" sur Render :\n\n` +
                                        `\`\`\`\n` +
                                        `PORT=10000\n` +
                                        `SESSION_ID=${sessionString}\n` +
                                        `OWNER_ID=${sessionId}\n` +
                                        `SUPABASE_URL=${process.env.SUPABASE_URL || 'VOTRE_URL_SUPABASE_ICI'}\n` +
                                        `SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY || 'VOTRE_CLE_ANON_ICI'}\n` +
                                        `PREFIXE=${prefix}\n` +
                                        `NOM_OWNER=${ownerName}\n` +
                                        `\`\`\`\n\n` +
                                        `_✅ Configuration prête pour déploiement._`;

                                    await sock.sendMessage(userJid, {
                                        image: { url: "https://img.freepik.com/free-vector/cyber-security-concept_23-2148532223.jpg" },
                                        caption: caption
                                    });
                                    console.log(`[WBOT] ✅ Session credentials sent to ${userJid}`);
                                }
                            }, 500);
                        } catch (e) {
                            console.error("[WBOT] Failed to send Session Credentials:", e);
                        }

                        // Welcome Message (OVL Style)
                        try {
                            let prefix = '1';
                            if (supabase && process.env.SUPABASE_URL) {
                                const { data: userSettings } = await supabase.from('user_settings').select('*').eq('user_id', sessionId).single();
                                prefix = userSettings?.view_once_prefix || '1';
                            }

                            const welcomeMsg = `╭───〔 🤖 𝙒𝘽𝙊𝙏 𝙋𝙍𝙊 〕───⬣\n` +
                                `│ ߷ Etat       ➜ Connecté ✅\n` +
                                `│ ߷ Préfixe    ➜ ${prefix}\n` +
                                `│ ߷ Mode       ➜ private\n` +
                                `│ ߷ Commandes  ➜ 12+\n` +
                                `│ ߷ Version    ➜ 4.0.0\n` +
                                `│ ߷ *Développeur*➜ Luis-Orvann\n` +
                                `╰──────────────⬣\n\n` +
                                `_Tapez !session pour obtenir vos identifiants Render._`;

                            await sock.sendMessage(userJid, { text: welcomeMsg });
                        } catch (e) { }
                    }
                }, 1000);
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    console.log(`[WBOT] 🔄 Reconnecting (Reason: ${statusCode})`);
                    const currentSession = sessions.get(sessionId);
                    sessions.set(sessionId, { ...currentSession, sock, status: 'reconnecting' });
                    io.to(sessionId).emit('status', { sessionId, status: 'reconnecting' });
                    setTimeout(() => startWhatsAppSession(sessionId, io), 5000);
                } else {
                    console.log(`[WBOT] 🚪 Logged Out.`);
                    sessions.delete(sessionId);
                    deleteSessionFolder(sessionId);
                    io.to(sessionId).emit('status', { sessionId, status: 'logged_out' });
                }
            }
        });

        // Contact Sync Helper
        const syncBatchContacts = async (contacts) => {
            if (!contacts?.length) return;
            const batch = contacts
                .filter(c => c.id?.endsWith('@s.whatsapp.net'))
                .map(c => ({
                    session_id: sessionId,
                    jid: c.id,
                    name: c.notify || c.name || c.verifiedName || c.id.split('@')[0]
                }));
            if (batch.length) {
                try { await supabase.from('contacts_settings').upsert(batch, { onConflict: 'session_id,jid' }); } catch (err) { }
            }
        };

        sock.ev.on('messaging-history.set', async ({ contacts }) => syncBatchContacts(contacts));
        sock.ev.on('contacts.set', async ({ contacts }) => syncBatchContacts(contacts));
        sock.ev.on('contacts.upsert', async (contacts) => syncBatchContacts(contacts));
        sock.ev.on('contacts.update', async (contacts) => syncBatchContacts(contacts));

        // Message Handling (The "A to Z" Core)
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            console.log(`[DEBUG] Received ${messages.length} messages. Type: ${type}`);

            // SKIP HISTORY SYNC (Fix for "Lag at startup")
            // 'append' messages are history/offline messages. We don't need to process them for bot commands.
            if (type === 'append') {
                console.log(`[DEBUG] Skipped History Batch (${messages.length} msgs)`);
                return;
            }
            if (type !== 'notify') return;

            // Determine User ID (UUID) for Settings Query
            const settingsId = process.env.OWNER_ID || (sessionId.includes('-') ? sessionId : null);

            let config = {
                anti_delete: true,
                anti_view_once: true,
                // Fail-safe: Default to TRUE (Ghost) to protect privacy if DB fetch fails
                ghost_mode_global: true,
                view_once_prefix: '1',
                status_save_prefix: '*',
                downloader_prefix: 'dl'
            };

            if (settingsId && supabase && process.env.SUPABASE_URL) {
                try {
                    const { data: userSettings } = await supabase.from('user_settings').select('*').eq('user_id', settingsId).single();
                    if (userSettings) config = { ...config, ...userSettings };
                } catch (e) {
                    console.log('[WBOT] Using default config (Supabase not available) -> Ghost Mode ON (Safety)');
                }
            }

            for (const msg of messages) {
                if (!msg.message) continue;

                const remoteJid = msg.key.remoteJid;

                // Ghost Mode Toggle (Controllable)
                // If ghost_mode_global = TRUE → Do NOT mark as read (no blue checkmarks for sender)
                // If ghost_mode_global = FALSE → Mark as read normally (blue checkmarks visible)
                if (!config.ghost_mode_global && !msg.key.fromMe) {
                    await sock.readMessages([msg.key]);
                }

                // Sync protection (Double Check: Ignore messages older than 2 minutes)
                const now = Math.floor(Date.now() / 1000);
                const messageTimestamp = (typeof msg.messageTimestamp === 'number') ? msg.messageTimestamp : msg.messageTimestamp?.low;

                if (messageTimestamp && (now - messageTimestamp > 120)) {
                    console.log(`[DEBUG] Skipped Old Message (${now - messageTimestamp}s latency)`);
                    continue;
                }

                const messageText = getText(msg.message).trim();
                const userJid = sock.user?.id ? jidNormalizedUser(sock.user.id) : null;

                if (!messageText) {
                    // console.log(`[DEBUG] Empty Text! Raw Message Structure:`, JSON.stringify(msg.message, null, 2));
                }

                // console.log(`[DEBUG] Processing: '${messageText}' | FromMe: ${msg.key.fromMe} | UserJid: ${userJid}`);

                if (!userJid) {
                    console.log('[DEBUG] Skipped: userJid is null');
                    continue;
                }

                // Cache for Anti-Delete
                if (!msg.key.fromMe) messageStore.set(`${sessionId}:${msg.key.id}`, msg);

                // --- [ COMMANDS & AUTOMATIONS (A to Z) ] ---
                console.log(`[DEBUG] Msg: '${messageText}' | FromMe: ${msg.key.fromMe} | Remote: ${remoteJid}`);

                // !ping
                if (messageText.toLowerCase() === '!ping') {
                    await sock.sendMessage(remoteJid, { react: { text: '🔵', key: msg.key } });
                    await sock.sendMessage(remoteJid, { text: '🏓 *WBOT PRO : Pong!*' });
                    continue;
                }

                // !session (Manual Trigger for Credentials)
                if (messageText.toLowerCase() === '!session') {
                    // SECURITY: STRICTLY ONLY "Note to Self" or from the OWNER_ID defined in Env
                    const isOwner = process.env.OWNER_ID && remoteJid.includes(process.env.OWNER_ID);
                    if (!msg.key.fromMe && !isOwner) {
                        console.log(`[SECURITY] 🛡️ Blocked !session command from ${remoteJid}`);
                        return;
                    }

                    try {
                        const credsBuffer = fs.readFileSync(path.join(authFolder, 'creds.json'));
                        const credsJson = JSON.parse(credsBuffer.toString());
                        const encodedCreds = Buffer.from(JSON.stringify(credsJson)).toString('base64');
                        const sessionString = `WBOT-MD_V2_${encodedCreds}`;

                        const caption = `*WBOT CONFIGURATION (MANUAL)*\n\n` +
                            `\`\`\`\n` +
                            `SESSION_ID=${sessionString}\n` +
                            `OWNER_ID=${sessionId}\n` +
                            `SUPABASE_URL=${process.env.SUPABASE_URL || 'VOTRE_URL_SUPABASE'}\n` +
                            `SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY || 'VOTRE_CLE_ANON'}\n` +
                            `PREFIXE=${config.view_once_prefix || '1'}\n` +
                            `NOM_OWNER=${sock.user?.name || sock.user?.notify || 'Moi'}\n` +
                            `\`\`\`\n\n` +
                            `_⚠️ Copiez tout pour le déploiement Render._`;

                        await sock.sendMessage(userJid, {
                            image: { url: "https://img.freepik.com/free-vector/cyber-security-concept_23-2148532223.jpg" },
                            caption: caption
                        });
                        console.log(`[WBOT] Session sent manually to ${userJid}`);
                    } catch (e) {
                        console.error("Failed to send manual session:", e);
                        await sock.sendMessage(remoteJid, { text: "❌ Erreur lors de la génération de la session." });
                    }
                    continue;
                }

                // 2. REPLY REDIRECTION (User replying to a "Rescued" message)
                // Check if this message is a reply from the Owner (Me)
                if (msg.key.fromMe && msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                    const quotedId = msg.message.extendedTextMessage.contextInfo.stanzaId;
                    const originalSender = replyMap.get(quotedId);

                    if (originalSender) {
                        try {
                            await sock.sendMessage(originalSender, { text: messageText });
                            await sock.sendMessage(userJid, { react: { text: '✅', key: msg.key } }); // Confirm sent
                        } catch (e) {
                            await sock.sendMessage(userJid, { react: { text: '❌', key: msg.key } });
                        }
                        continue; // Done handling this reply
                    }
                }

                // 3. PREFIX CHECK (Dynamic from settings)
                const viewOncePrefix = config.view_once_prefix || '1';
                const statusPrefix = config.status_save_prefix || '*';
                const dlPrefix = config.downloader_prefix || 'dl';

                // Anti-Delete
                // Anti-Delete (OVL Style)
                if (msg.message.protocolMessage?.type === 0 && config.anti_delete) {
                    const targetId = msg.message.protocolMessage.key.id;
                    const original = messageStore.get(`${sessionId}:${targetId}`);

                    if (original) {
                        const sender = original.pushName || original.key.participant?.split('@')[0] || 'Inconnu';
                        const chatName = remoteJid === 'status@broadcast' ? 'Statut' : remoteJid;
                        const captionBase = `🗑️ *WBOT ANTIDELETE*\n👤 *De:* ${sender}\n💬 *Sur:* ${chatName}\n🕒 *Heure:* ${new Date().toLocaleTimeString()}`;

                        try {
                            const originalMsg = original.message;
                            const isImage = originalMsg.imageMessage;
                            const isVideo = originalMsg.videoMessage;
                            const isAudio = originalMsg.audioMessage;
                            const isText = getText(originalMsg);

                            let sent = false;

                            if (isImage || isVideo || isAudio) {
                                // Download and Re-Upload
                                const buffer = await downloadMediaMessage({ message: originalMsg }, 'buffer', {}, { logger, rekey: false });
                                if (isImage) await sock.sendMessage(userJid, { image: buffer, caption: captionBase });
                                else if (isVideo) await sock.sendMessage(userJid, { video: buffer, caption: captionBase });
                                else if (isAudio) await sock.sendMessage(userJid, { audio: buffer, mimetype: 'audio/mp4' }); // Send as voice note or audio
                                sent = true;
                            }

                            // Always fallback/send text if media failed or it was text
                            if (!sent && isText) {
                                await sock.sendMessage(userJid, { text: `${captionBase}\n\n📝 *Message:* \n${isText}` });
                            }
                        } catch (e) {
                            console.error("Anti-Delete Error:", e);
                            await sock.sendMessage(userJid, { text: `${captionBase}\n\n❌ *Erreur:* Média non récupérable (trop ancien ou non mis en cache).` });
                        }
                    }
                }

                // IGNORE HISTORY SYNC & PROTOCOL MESSAGES (Fixes "Empty Text" spam)
                if (msg.message.protocolMessage || msg.message.senderKeyDistributionMessage) {
                    continue;
                }

                // Ping Test (Added Back)
                if (messageText === '!ping') {
                    const start = Date.now();
                    await sock.sendMessage(remoteJid, { text: 'Pong 🏓' });
                    // const end = Date.now();
                    // await sock.sendMessage(remoteJid, { text: `Vitesse: ${end - start}ms` });
                    continue;
                }

                // Reseaux Sociaux Downloader (dl [url])
                if (messageText.toLowerCase().startsWith(dlPrefix + ' ')) {
                    const url = messageText.split(' ')[1];
                    if (!url || !url.includes('http')) {
                        await sock.sendMessage(remoteJid, { text: `❌ *WBOT:* Ajoutez un lien après "${dlPrefix}"\n\nExemple: ${dlPrefix} https://tiktok.com/...` });
                        continue;
                    }
                    if (url) {
                        await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });
                        let mediaUrl = null;
                        if (url.includes('tiktok.com')) mediaUrl = await downloader.tiktokDl(url);
                        else if (url.includes('facebook.com') || url.includes('fb.watch')) mediaUrl = await downloader.facebookDl(url);
                        else if (url.includes('instagram.com')) mediaUrl = await downloader.instagramDl(url);

                        if (mediaUrl) {
                            await sock.sendMessage(remoteJid, { video: { url: mediaUrl }, caption: `📥 *WBOT DOWNLOADER*\n🔗 *Source:* ${url}` });
                            await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
                        } else {
                            await sock.sendMessage(remoteJid, { text: `❌ *WBOT:* Impossible de récupérer ce média (Lien invalide ou protégé).` });
                        }
                    }
                    continue;
                }

                // Simple Replies: View Once & Status
                const context = msg.message.extendedTextMessage?.contextInfo || msg.message.imageMessage?.contextInfo || msg.message.videoMessage?.contextInfo;
                if (context?.quotedMessage) {
                    const quoted = context.quotedMessage;
                    const isVO = quoted.viewOnceMessage || quoted.viewOnceMessageV2 || quoted.viewOnceMessageV2Extension;

                    // --- TRIGGERED VIEW ONCE RESCUE ---
                    if (messageText === viewOncePrefix && !isVO) {
                        await sock.sendMessage(remoteJid, { text: `❌ *WBOT:* Répondez à une vue unique avec "${viewOncePrefix}" pour la sauvegarder.` });
                        continue;
                    }
                    if (isVO && (messageText === viewOncePrefix)) {
                        await sock.sendMessage(remoteJid, { react: { text: '👀', key: msg.key } });
                        try {
                            const actualVO = quoted.viewOnceMessage?.message || quoted.viewOnceMessageV2?.message || quoted.viewOnceMessageV2Extension?.message;
                            if (actualVO) {
                                // Download media
                                const buffer = await downloadMediaMessage({ message: actualVO }, 'buffer', {}, { logger, rekey: false });
                                const type = Object.keys(actualVO)[0];

                                // Send to USER (Owner) with Custom Caption
                                const rescueCaption = `📸 *WBOT VIEW ONCE RESCUE*\n👤 *De:* ${msg.pushName || 'Contact'}\n💬 *Chat:* ${remoteJid}`;
                                let sentMsg;

                                if (type === 'imageMessage') sentMsg = await sock.sendMessage(userJid, { image: buffer, caption: rescueCaption });
                                else if (type === 'videoMessage') sentMsg = await sock.sendMessage(userJid, { video: buffer, caption: rescueCaption });
                                else if (type === 'audioMessage') sentMsg = await sock.sendMessage(userJid, { audio: buffer, mimetype: 'audio/mp4' });
                                else sentMsg = await sock.sendMessage(userJid, { forward: { key: msg.key, message: actualVO } });

                                // SAVE FOR REPLY REDIRECTION
                                if (sentMsg?.key?.id) {
                                    replyMap.set(sentMsg.key.id, remoteJid); // Map our sent message ID to the original chat JID
                                }
                            }
                        } catch (e) {
                            console.error("VO Rescue Error:", e);
                            await sock.sendMessage(remoteJid, { text: "❌ Erreur lors de la récupération." });
                        }
                    }

                    // --- TRIGGERED STATUS SAVER ---
                    const isStatus = remoteJid === 'status@broadcast' || context.remoteJid === 'status@broadcast';
                    if (messageText === statusPrefix && !isStatus) {
                        await sock.sendMessage(remoteJid, { text: `❌ *WBOT:* Répondez à un statut avec "${statusPrefix}" pour le sauvegarder.` });
                        continue;
                    }
                    if (isStatus && (messageText === statusPrefix)) {
                        await sock.sendMessage(remoteJid, { react: { text: '⭐', key: msg.key } });
                        try {
                            // Extract caption from the Status
                            const statusCaption = quoted.imageMessage?.caption || quoted.videoMessage?.caption || quoted.conversation || quoted.extendedTextMessage?.text || "";

                            // Forward with original caption
                            // Using forward is safer for statuses, but we force the caption.
                            await sock.sendMessage(userJid, {
                                forward: { key: msg.key, message: quoted },
                                caption: statusCaption ? `${statusCaption}\n\n⭐ *WBOT SAVED*` : `⭐ *WBOT SAVED*`
                            });
                        } catch (e) {
                            console.error("Status Save Error:", e);
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error(`[WBOT] FATAL ERROR:`, err);
        io.to(sessionId).emit('error', { message: 'Failed' });
    }
};

/**
 * DOUBLE SCHEDULER (Messages & Statuses)
 * Checks for pending tasks every minute
 */
let schedulerStarted = false;
export const startScheduler = (io) => {
    if (schedulerStarted) return;
    schedulerStarted = true;

    console.log(`[WBOT] 📅 Double Scheduler Started (Every 60s)`);

    cron.schedule('* * * * *', async () => {
        const { data: tasks, error } = await supabase
            .from('scheduled_tasks')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_at', new Date().toISOString());

        if (error || !tasks?.length) return;

        for (const task of tasks) {
            const session = sessions.get(task.session_id);
            if (!session?.sock) continue;

            try {
                const target = task.type === 'status' ? 'status@broadcast' : task.recipient;

                if (task.media_url) {
                    const isVideo = task.media_url.includes('.mp4') || task.media_url.includes('.mov');
                    const options = isVideo ? { video: { url: task.media_url } } : { image: { url: task.media_url } };
                    await session.sock.sendMessage(target, { ...options, caption: task.content });
                } else {
                    await session.sock.sendMessage(target, { text: task.content });
                }

                await supabase.from('scheduled_tasks').update({ status: 'sent' }).eq('id', task.id);
                console.log(`[WBOT] 📤 Scheduled ${task.type} sent for ${task.session_id}`);
            } catch (err) {
                console.error(`[WBOT] ❌ Failed scheduled task ${task.id}:`, err.message);
                await supabase.from('scheduled_tasks').update({ status: 'failed', error: err.message }).eq('id', task.id);
            }
        }
    });
};

export const stopWhatsAppSession = async (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) return deleteSessionFolder(sessionId), true;
    try {
        await session.sock.logout();
        session.sock.end();
        sessions.delete(sessionId);
        deleteSessionFolder(sessionId);
        return true;
    } catch (e) { return false; }
};

export const getSession = (sessionId) => sessions.get(sessionId)?.sock;
export const getSessionStatus = (sessionId) => sessions.get(sessionId)?.status || 'disconnected';

export const requestPairingCode = async (sessionId, phoneNumber) => {
    const session = sessions.get(sessionId);
    if (!session?.sock) throw new Error('No session');
    const code = await session.sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));

    // Store pairing code
    const currentSession = sessions.get(sessionId);
    if (currentSession) {
        sessions.set(sessionId, { ...currentSession, pairingCode: code });
    }

    return code;
};

export const initAllSessions = async (io) => {
    const authDir = path.join(__dirname, '..', 'auth_sessions');
    if (!fs.existsSync(authDir)) return;
    try {
        const folders = fs.readdirSync(authDir).filter(f => fs.statSync(path.join(authDir, f)).isDirectory());
        for (const sid of folders) {
            if (fs.existsSync(path.join(authDir, sid, 'creds.json'))) {
                await startWhatsAppSession(sid, io);
            }
        }
    } catch (e) { }
};

export const repairSession = (sessionId, io) => startWhatsAppSession(sessionId, io, true);
export const resetSession = (sessionId, io) => startWhatsAppSession(sessionId, io, true);

export const getSessionQR = (sessionId) => sessions.get(sessionId)?.qr || null;
export const getSessionPairingCode = (sessionId) => sessions.get(sessionId)?.pairingCode || null;

export default startWhatsAppSession;
