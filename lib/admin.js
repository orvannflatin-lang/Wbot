import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load Env if not already loaded (safe to reload)
dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

// Use SERVICE ROLE KEY for Admin actions (Bypass RLS)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const getAllUsers = async () => {
    // List users from auth.users (requires service role)
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        throw error;
    }
    return users;
};

export const deleteUser = async (userId) => {
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
        throw error;
    }
    return data;
};
