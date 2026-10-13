-- ========================================================
-- MASARIFI DATABASE SCHEMA (Run this in Supabase SQL Editor)
-- ========================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. EXPENSES / TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT DEFAULT '',
  type TEXT DEFAULT 'expense', -- 'expense' or 'income'
  recurring BOOLEAN DEFAULT false,
  custom_category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  UNIQUE(user_id, category)
);

-- 4. REVIEWS TABLE (Publicly shared for the landing page)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id) -- One review per user
);

-- Enable Row Level Security (RLS) but allow public reads/writes for simplicity initially
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Permissive policies for our API client:
CREATE POLICY "Public profiles access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public expenses access" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public budgets access" ON public.budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public reviews access" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
