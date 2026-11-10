-- Install editable RBAC defaults once, before the API starts checking these reads.
WITH collections(path) AS (
  VALUES
    ('/api/website-builder/buttons'),
    ('/api/website-builder/buttons-arrays'),
    ('/api/website-builder/buttons-arrays-to-buttons'),
    ('/api/website-builder/buttons-to-file-storage-module-files'),
    ('/api/website-builder/features'),
    ('/api/website-builder/features-to-buttons-arrays'),
    ('/api/website-builder/features-to-file-storage-module-files'),
    ('/api/website-builder/logotypes'),
    ('/api/website-builder/logotypes-to-file-storage-module-files'),
    ('/api/website-builder/sliders'),
    ('/api/website-builder/sliders-to-slides'),
    ('/api/website-builder/slides'),
    ('/api/website-builder/slides-to-buttons-arrays'),
    ('/api/website-builder/slides-to-file-storage-module-files'),
    ('/api/website-builder/widgets'),
    ('/api/website-builder/widgets-to-buttons-arrays'),
    ('/api/website-builder/widgets-to-features'),
    ('/api/website-builder/widgets-to-file-storage-module-files'),
    ('/api/website-builder/widgets-to-logotypes'),
    ('/api/website-builder/widgets-to-sliders'),
    ('/api/file-storage/files'),
    ('/api/file-storage/widgets'),
    ('/api/file-storage/widgets-to-files')
), public_reads(method, path) AS (
  SELECT 'GET', collections.path || reads.suffix
  FROM collections CROSS JOIN (VALUES (''), ('/count'), ('/:uuid')) AS reads(suffix)
  UNION ALL VALUES
    ('GET', '/api/file-storage/files/:uuid/content'),
    ('HEAD', '/api/file-storage/files/:uuid/content')
)
INSERT INTO sps_rc_permission (type, method, path)
SELECT 'HTTP', public_reads.method, public_reads.path
FROM public_reads
WHERE NOT EXISTS (
  -- Keep a project's existing parameter name, permission ID and role bindings.
  SELECT 1 FROM sps_rc_permission existing
  WHERE existing.type = 'HTTP' AND existing.method = public_reads.method
    AND regexp_replace(existing.path, '\[[^]/]+\]', ':uuid', 'g') = public_reads.path
)
ON CONFLICT (type, method, path) DO NOTHING;
