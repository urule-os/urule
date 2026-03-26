-- Seed default org and workspace for demo mode
-- These are referenced by providers, conversations, and agents via foreign keys.

\c registry

INSERT INTO orgs (id, name, slug, status, created_at, updated_at)
VALUES ('01DEMO00000000000000000000', 'Demo Organization', 'demo-org', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO workspaces (id, org_id, name, slug, description, status, created_at, updated_at)
VALUES ('01DEMO00000000000000000001', '01DEMO00000000000000000000', 'Default Workspace', 'default', 'Default workspace for demo', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
