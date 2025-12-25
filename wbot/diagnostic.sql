-- DIAGNOSTIC: Check if trigger and tables exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if profiles table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Check if user_stats table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_stats';

-- Check existing profiles (if any)
SELECT id, email, full_name, created_at FROM profiles;

-- Check existing user_stats (if any)
SELECT user_id, messages_processed, deleted_messages_captured FROM user_stats;
