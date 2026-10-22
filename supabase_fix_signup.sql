-- ==============================================================================
-- MASARIFI SECURE USER REGISTRATION & AUTH FIX
-- Run this in Supabase -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create the secure server-side user registration function
CREATE OR REPLACE FUNCTION register_user(p_name TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID, 
  name TEXT, 
  role TEXT, 
  created_at TIMESTAMPTZ, 
  success BOOLEAN, 
  error_code TEXT
) AS $$
DECLARE
  v_new_id UUID;
  v_created TIMESTAMPTZ;
BEGIN
  -- Check if username already exists (case-insensitive)
  IF EXISTS (SELECT 1 FROM profiles WHERE LOWER(profiles.name) = LOWER(p_name)) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ, FALSE, 'nameExists'::TEXT;
    RETURN;
  END IF;

  -- Insert new user profile securely
  INSERT INTO profiles (name, password, role)
  VALUES (p_name, p_password, 'user')
  RETURNING profiles.id, profiles.created_at INTO v_new_id, v_created;

  RETURN QUERY SELECT v_new_id, p_name, 'user'::TEXT, v_created, TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions to public/anon callers
REVOKE ALL ON FUNCTION register_user(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_user(TEXT, TEXT) TO anon, authenticated, service_role;

-- 2. Make sure profiles table permits INSERT and SELECT policies
GRANT SELECT, INSERT ON profiles TO anon, authenticated;

-- Ensure RLS allows inserting new user accounts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles insert'
  ) THEN
    CREATE POLICY "Public profiles insert" ON profiles FOR INSERT WITH CHECK (true);
  END IF;
END $$;
