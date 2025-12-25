-- Add session_dump column to user_settings for V4 Session Storage
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'session_dump') THEN
        ALTER TABLE user_settings ADD COLUMN session_dump jsonb;
    END IF;
END $$;
