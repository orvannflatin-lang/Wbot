-- MISSING COLUMNS FOR V4 SESSION STORAGE
-- Add these columns to user_settings table

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS session_id_ovl text,
ADD COLUMN IF NOT EXISTS session_dump jsonb,
ADD COLUMN IF NOT EXISTS owner_name text;

-- Service role needs full access to session_dump for restoration
DROP POLICY IF EXISTS "Service role full access to user_settings" ON user_settings;
CREATE POLICY "Service role full access to user_settings" 
ON user_settings 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
