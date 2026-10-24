-- ==============================================================================
-- MASARIFI DATABASE CROSS-DEVICE SYNC & TICKETS HARDENING
-- Run this in Supabase -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Ensure budgets table exists with RLS and permissions
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Public budgets access'
  ) THEN
    CREATE POLICY "Public budgets access" ON public.budgets FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON public.budgets TO anon, authenticated, service_role;

-- 2. Dedicated support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT DEFAULT 'مستخدم',
  category TEXT DEFAULT 'general',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  contact TEXT DEFAULT '',
  status TEXT DEFAULT 'new', -- 'new', 'in_progress', 'resolved'
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Public support tickets access'
  ) THEN
    CREATE POLICY "Public support tickets access" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON public.support_tickets TO anon, authenticated, service_role;

-- 3. Secure RPC helper to save user budgets directly to profile column
CREATE OR REPLACE FUNCTION save_user_budgets(p_user_id UUID, p_budgets JSONB)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET budgets = p_budgets WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION save_user_budgets(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_user_budgets(UUID, JSONB) TO anon, authenticated, service_role;

-- 4. Enable Supabase Realtime publication on budgets and support_tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'support_tickets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
