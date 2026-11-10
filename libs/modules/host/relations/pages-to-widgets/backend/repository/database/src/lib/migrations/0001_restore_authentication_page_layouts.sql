-- Keep the sign-in page and all its existing widget, layout and metadata links.
UPDATE sps_h_page AS page
SET url = '/rbac/subject/authentication/email-and-password', updated_at = now()
WHERE page.url = '/ai-chat/sign-in'
  AND NOT EXISTS (
    SELECT 1 FROM sps_h_page WHERE url = '/rbac/subject/authentication/email-and-password'
  );
--> statement-breakpoint
-- The three earlier RBAC pages already have a public identity. Rebind only
-- their original, single default layout and widget. Custom compositions win.
WITH routes(action, old_path, old_widget, studio_widget) AS (
  VALUES
    ('registration', '/ai-chat/create-account', 'rbac-subject-login-and-password-registration', 'ai-chat-host-create-account'),
    ('forgot-password', '/ai-chat/forgot-password', 'rbac-login-and-password-forgot-password', 'ai-chat-host-forgot-password'),
    ('reset-password', '/ai-chat/reset-password', 'rbac-login-and-password-reset-password', 'ai-chat-host-reset-password')
), bindings AS (
  SELECT pl.id AS layout_link, pw.id AS widget_link,
         source_pl.lt_id AS layout_id, source_pw.wt_id AS widget_id
  FROM routes r
  JOIN sps_h_page p ON p.url = '/rbac/subject/authentication/email-and-password/' || r.action AND p.variant = 'noindex'
  JOIN sps_h_ps_to_ls_gxd pl ON pl.pe_id = p.id AND pl.variant = 'default'
  JOIN sps_h_layout l ON l.id = pl.lt_id AND l.slug = 'asdffd'
  JOIN sps_h_ps_to_ws_xyv pw ON pw.pe_id = p.id AND pw.variant = 'default'
  JOIN sps_h_widget w ON w.id = pw.wt_id AND w.slug = r.old_widget
  JOIN sps_h_page source ON source.url = r.old_path AND source.variant = 'noindex'
  JOIN sps_h_ps_to_ls_gxd source_pl ON source_pl.pe_id = source.id AND source_pl.variant = 'default'
  JOIN sps_h_layout source_l ON source_l.id = source_pl.lt_id AND source_l.slug = 'ai-chat-layout'
  JOIN sps_h_ps_to_ws_xyv source_pw ON source_pw.pe_id = source.id AND source_pw.variant = 'default'
  JOIN sps_h_widget source_w ON source_w.id = source_pw.wt_id AND source_w.slug = r.studio_widget
  WHERE (SELECT count(*) FROM sps_h_ps_to_ls_gxd WHERE pe_id = p.id) = 1
    AND (SELECT count(*) FROM sps_h_ps_to_ws_xyv WHERE pe_id = p.id) = 1
    AND (SELECT count(*) FROM sps_h_ps_to_ls_gxd WHERE pe_id = source.id) = 1
    AND (SELECT count(*) FROM sps_h_ps_to_ws_xyv WHERE pe_id = source.id) = 1
), update_layouts AS (
  UPDATE sps_h_ps_to_ls_gxd link SET lt_id = b.layout_id, updated_at = now()
  FROM bindings b WHERE link.id = b.layout_link
)
UPDATE sps_h_ps_to_ws_xyv link SET wt_id = b.widget_id, updated_at = now()
FROM bindings b WHERE link.id = b.widget_link;
