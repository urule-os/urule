#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname registry <<'SQL'

CREATE TABLE IF NOT EXISTS orgs (
  id VARCHAR(26) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id VARCHAR(26) PRIMARY KEY,
  org_id VARCHAR(26) NOT NULL REFERENCES orgs(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(26) PRIMARY KEY,
  workspace_id VARCHAR(26) NOT NULL REFERENCES workspaces(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'general',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(26) PRIMARY KEY,
  workspace_id VARCHAR(26) NOT NULL REFERENCES workspaces(id),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  personality_pack_id VARCHAR(26),
  skill_packs JSONB NOT NULL DEFAULT '[]',
  mcp_bindings JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'idle',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS runtimes (
  id VARCHAR(26) PRIMARY KEY,
  workspace_id VARCHAR(26) NOT NULL REFERENCES workspaces(id),
  provider VARCHAR(100) NOT NULL,
  profile VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  capabilities JSONB NOT NULL DEFAULT '{}',
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS installations (
  id VARCHAR(26) PRIMARY KEY,
  workspace_id VARCHAR(26) NOT NULL REFERENCES workspaces(id),
  package_id VARCHAR(26) NOT NULL,
  version VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  installed_at TIMESTAMPTZ,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS providers (
  id VARCHAR(26) PRIMARY KEY,
  workspace_id VARCHAR(26) NOT NULL REFERENCES workspaces(id),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL DEFAULT '',
  base_url TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(26) PRIMARY KEY,
  workspace_id VARCHAR(26) NOT NULL REFERENCES workspaces(id),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'direct',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_agents (
  conversation_id VARCHAR(26) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id VARCHAR(26) NOT NULL REFERENCES agents(id),
  PRIMARY KEY (conversation_id, agent_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(26) PRIMARY KEY,
  conversation_id VARCHAR(26) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  sender_type VARCHAR(20) NOT NULL DEFAULT 'user',
  content TEXT NOT NULL DEFAULT '',
  content_type VARCHAR(50) NOT NULL DEFAULT 'text',
  status VARCHAR(20) NOT NULL DEFAULT 'delivered',
  token_count INTEGER NOT NULL DEFAULT 0,
  action_buttons JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SQL

echo "Registry schema initialized."
