-- ==============================================================================
-- FIX: Temporarily disable the trigger, set Admin role, then re-enable it
-- Paste and run this in Supabase SQL Editor:
-- ==============================================================================

-- 1. Disable the trigger so database administrator can set roles
ALTER TABLE profiles DISABLE TRIGGER trg_prevent_role_escalation;

-- 2. Update Admin to have the 'admin' role
UPDATE profiles SET role = 'admin' WHERE LOWER(name) = 'admin';

-- 3. Re-enable the trigger to keep public attackers blocked
ALTER TABLE profiles ENABLE TRIGGER trg_prevent_role_escalation;
