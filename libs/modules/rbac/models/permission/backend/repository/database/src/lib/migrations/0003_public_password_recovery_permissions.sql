INSERT INTO sps_rc_permission (type, method, path)
VALUES
  ('HTTP', 'POST', '/api/rbac/subjects/authentication/email-and-password/forgot-password'),
  ('HTTP', 'POST', '/api/rbac/subjects/authentication/email-and-password/reset-password')
ON CONFLICT (type, method, path) DO NOTHING;
