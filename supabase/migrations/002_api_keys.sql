-- API Keys for programmatic access (CLI, MCP, Zapier)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{read,write}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_org ON api_keys(organization_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select" ON api_keys FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "api_keys_insert" ON api_keys FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "api_keys_delete" ON api_keys FOR DELETE
  USING (organization_id = get_user_org_id());
