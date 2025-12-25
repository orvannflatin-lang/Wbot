import { supabase } from './lib/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applySchema() {
    console.log('[SCHEMA] Starting to apply schema...');

    // Read the settings SQL
    const sqlPath = path.join(__dirname, '..', 'supabase_settings.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('[SCHEMA] supabase_settings.sql not found at', sqlPath);
        return;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Note: Supabase JS client doesn't have an easy "run raw SQL" method for security reasons.
    // However, we can try to create the table by checking if it exists or using the RPC if configured.
    // Instead, I will inform the user clearly that they MUST run this in the dashboard,
    // OR I will try to use the REST API to check connectivity.

    console.log('[SCHEMA] Please ensure you have run the following SQL in your Supabase Dashboard:');
    console.log(sql);

    try {
        console.log('[SCHEMA] Testing connection to Supabase...');
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('[SCHEMA] ✅ Supabase connection successful.');
    } catch (err) {
        console.error('[SCHEMA] ❌ Supabase connection failed:', err.message);
    }
}

applySchema();
