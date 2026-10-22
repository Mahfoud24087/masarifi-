-- Set the newly created 'Admin' account to role='admin'
-- Run this in Supabase SQL Editor:
UPDATE profiles SET role = 'admin' WHERE LOWER(name) = 'admin';
