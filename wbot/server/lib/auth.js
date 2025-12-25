import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Custom Auth Adapter for Baileys using Supabase
 * @param {string} sessionId 
 * @returns 
 */
export const useSupabaseAuthState = async (sessionId) => {
    const TABLE_NAME = 'whatsapp_sessions';

    // Helper to read JSON
    const readData = async (key) => {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('data')
                .eq('session_id', sessionId)
                .eq('key', key)
                .single();

            if (error || !data) return null;
            return JSON.parse(data.data);
        } catch (error) {
            return null;
        }
    };

    const writeData = async (key, data) => {
        try {
            await supabase
                .from(TABLE_NAME)
                .upsert({
                    session_id: sessionId,
                    key: key,
                    data: JSON.stringify(data)
                }, { onConflict: 'session_id,key' });
        } catch (error) {
            console.error(`Error writing ${key} to Supabase:`, error);
        }
    };

    const removeData = async (key) => {
        try {
            await supabase
                .from(TABLE_NAME)
                .delete()
                .eq('session_id', sessionId)
                .eq('key', key);
        } catch (error) {
            console.error(`Error deleting ${key} from Supabase:`, error);
        }
    };

    const creds = (await readData('creds')) || (await import('@whiskeysockets/baileys')).initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            value = (await import('@whiskeysockets/baileys')).proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        if (value) {
                            data[id] = value;
                        }
                    }));
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(key, value));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => {
            return writeData('creds', creds);
        }
    };
};
