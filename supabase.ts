import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kgwrlutwqnfhqizeftgb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_LfrfIUHrMz7h5T4yIB1i3w_I1U7lec_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
