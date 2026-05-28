-- ─────────────────────────────────────────────────────────────────────────────
-- Nexora Collaboration — tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Rooms
CREATE TABLE IF NOT EXISTS collab_rooms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  owner_id      TEXT NOT NULL,         -- user_id du créateur (API key owner)
  invite_token  TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Members (présence)
CREATE TABLE IF NOT EXISTS collab_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID NOT NULL REFERENCES collab_rooms(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL,         -- peut être un user_id Supabase ou un ID temporaire
  display_name  TEXT NOT NULL,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS collab_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES collab_rooms(id) ON DELETE CASCADE,
  sender_id    TEXT NOT NULL,
  sender_name  TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT NOT NULL,
  model_id     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_collab_messages_room_created
  ON collab_messages (room_id, created_at);

CREATE INDEX IF NOT EXISTS idx_collab_members_room_seen
  ON collab_members (room_id, last_seen_at);

-- Auto-update updated_at sur les rooms
CREATE OR REPLACE FUNCTION update_collab_room_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS collab_rooms_updated_at ON collab_rooms;
CREATE TRIGGER collab_rooms_updated_at
  BEFORE UPDATE ON collab_rooms
  FOR EACH ROW EXECUTE FUNCTION update_collab_room_timestamp();

-- RLS désactivé — accès contrôlé au niveau API (service role key)
ALTER TABLE collab_rooms    DISABLE ROW LEVEL SECURITY;
ALTER TABLE collab_members  DISABLE ROW LEVEL SECURITY;
ALTER TABLE collab_messages DISABLE ROW LEVEL SECURITY;
