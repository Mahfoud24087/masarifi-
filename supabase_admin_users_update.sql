-- Update admin_get_all_users RPC to include expense/income breakdown
CREATE OR REPLACE FUNCTION admin_get_all_users(p_admin_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  expense_count BIGINT,
  income_count BIGINT,
  expense_total NUMERIC,
  income_total NUMERIC
) AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = p_admin_id AND profiles.role = 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.role,
    p.created_at,
    COUNT(e.id) FILTER (WHERE e.type = 'expense' AND e.category != '__support_ticket__')::BIGINT AS expense_count,
    COUNT(e.id) FILTER (WHERE e.type = 'income')::BIGINT AS income_count,
    COALESCE(SUM(e.amount) FILTER (WHERE e.type = 'expense' AND e.category != '__support_ticket__'), 0) AS expense_total,
    COALESCE(SUM(e.amount) FILTER (WHERE e.type = 'income'), 0) AS income_total
  FROM profiles p
  LEFT JOIN expenses e ON e.user_id = p.id
  GROUP BY p.id, p.name, p.role, p.created_at
  ORDER BY (COUNT(e.id) FILTER (WHERE e.category != '__support_ticket__')) DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION admin_get_all_users(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_get_all_users(UUID) TO anon, authenticated, service_role;
