-- Run this in the Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → paste → Run

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS budgets JSONB DEFAULT '{}'::jsonb;
