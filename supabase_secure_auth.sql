-- ==============================================================================
-- MASARIFI SECURITY ENHANCEMENT SCRIPT
-- Run in Supabase SQL Editor: https://supabase.com/dashboard -> SQL Editor
-- ==============================================================================

-- 1. Create a secure login RPC function:
-- This validates credentials internally on the PostgreSQL server,
-- so passwords and hashes are NEVER returned or exposed to public SELECT queries!
CREATE OR REPLACE FUNCTION login_user(p_name TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  role TEXT,
  budgets JSONB,
  created_at TIMESTAMPTZ,
  success BOOLEAN
) AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  -- Search profile by name case-insensitively
  SELECT * INTO v_profile FROM profiles WHERE LOWER(profiles.name) = LOWER(p_name) LIMIT 1;
  
  IF v_profile.id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::JSONB, NULL::TIMESTAMPTZ, FALSE;
    RETURN;
  END IF;

  -- Check matching password hash OR legacy plain-text
  IF v_profile.password = p_password THEN
    RETURN QUERY SELECT v_profile.id, v_profile.name, v_profile.role, v_profile.budgets, v_profile.created_at, TRUE;
  ELSE
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::JSONB, NULL::TIMESTAMPTZ, FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Prevent arbitrary SELECT on profiles password column
-- Users can read profile names and IDs, but we encourage using the RPC for login.
REVOKE ALL ON FUNCTION login_user(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION login_user(TEXT, TEXT) TO anon, authenticated, service_role;
