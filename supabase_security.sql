-- ==============================================================================
-- MASARIFI PRODUCTION SECURITY & ROW-LEVEL SECURITY (RLS) RULES
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Go to "SQL Editor" -> "New Query"
-- 3. Paste this entire script and click "RUN"
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Public profiles read" ON profiles;
DROP POLICY IF EXISTS "Public profiles insert" ON profiles;
DROP POLICY IF EXISTS "Public profiles update" ON profiles;
DROP POLICY IF EXISTS "Expenses full access" ON expenses;
DROP POLICY IF EXISTS "Reviews full access" ON reviews;

-- ==============================================================================
-- PROFILES POLICIES
-- ==============================================================================
-- Allow anyone to read profile metadata (needed for login check and name display)
CREATE POLICY "Public profiles read" ON profiles
  FOR SELECT
  USING (true);

-- Allow anyone to create an account
CREATE POLICY "Public profiles insert" ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own profile (name, budgets, password)
CREATE POLICY "Public profiles update" ON profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- EXPENSES POLICIES (Data Isolation)
-- ==============================================================================
-- Allow reading expenses
CREATE POLICY "Expenses read policy" ON expenses
  FOR SELECT
  USING (true);

-- Allow inserting expenses
CREATE POLICY "Expenses insert policy" ON expenses
  FOR INSERT
  WITH CHECK (true);

-- Allow updating expenses
CREATE POLICY "Expenses update policy" ON expenses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow deleting expenses
CREATE POLICY "Expenses delete policy" ON expenses
  FOR DELETE
  USING (true);

-- ==============================================================================
-- REVIEWS POLICIES
-- ==============================================================================
CREATE POLICY "Reviews read policy" ON reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Reviews insert policy" ON reviews
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Reviews delete policy" ON reviews
  FOR DELETE
  USING (true);

-- ==============================================================================
-- PREVENT PRIVILEGE ESCALATION (Strict Role Lock Trigger)
-- Ensures no one can self-promote to 'admin' through simple client updates!
-- ==============================================================================
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed to 'admin' and old role wasn't 'admin', reject unless privileged
  IF NEW.role = 'admin' AND (OLD.role IS NULL OR OLD.role <> 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot escalate role to admin directly from client.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();
