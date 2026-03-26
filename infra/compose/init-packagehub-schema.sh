#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname packagehub <<'SQL'

CREATE TABLE IF NOT EXISTS packages (
  id VARCHAR(26) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author VARCHAR(255) NOT NULL,
  repository VARCHAR(500),
  homepage VARCHAR(500),
  license VARCHAR(50),
  verified BOOLEAN NOT NULL DEFAULT false,
  downloads INTEGER NOT NULL DEFAULT 0,
  tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS package_versions (
  id VARCHAR(26) PRIMARY KEY,
  package_id VARCHAR(26) NOT NULL REFERENCES packages(id),
  version VARCHAR(50) NOT NULL,
  manifest JSONB NOT NULL,
  readme TEXT NOT NULL DEFAULT '',
  checksum VARCHAR(128),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  yanked BOOLEAN NOT NULL DEFAULT false
);

-- Enable pg_trgm for search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

SQL

echo "PackageHub schema initialized."
