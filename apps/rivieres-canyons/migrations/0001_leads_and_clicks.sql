-- Leads and outbound clicks (packages/core/src/edge, SCHEMA_SQL). Apply with: wrangler d1 migrations apply
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY, site TEXT NOT NULL, source TEXT NOT NULL, magnet TEXT NOT NULL, page TEXT NOT NULL,
  email TEXT NOT NULL, phone TEXT, consent INTEGER NOT NULL, consent_text TEXT NOT NULL, consent_text_version TEXT NOT NULL,
  utm TEXT NOT NULL DEFAULT '{}', bot_check TEXT NOT NULL, update_token TEXT, created_at TEXT NOT NULL, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, target TEXT NOT NULL, ref TEXT, utm TEXT NOT NULL DEFAULT '{}',
  outcome TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS clicks_target ON clicks (kind, target, created_at);
CREATE INDEX IF NOT EXISTS leads_created ON leads (created_at);
