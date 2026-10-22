-- ============================================================
-- Masarifi – Supabase Migration
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- 1. Add role column ('user' | 'admin')
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Add budgets column for cross-device budget sync
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budgets JSONB DEFAULT '{}'::jsonb;

-- 3. Set the admin user (adjust the name to match your admin account)
UPDATE profiles SET role = 'admin' WHERE name ILIKE 'Admin';

-- ============================================================
-- After running this migration:
-- • Any user whose name is 'Admin' (case-insensitive) becomes admin.
-- • All other users default to role='user'.
-- • Passwords will be re-hashed on next login (migration path built into app).
-- ============================================================
