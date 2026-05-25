-- =============================================
-- NEXORA - Tables de Collaboration (Migration 002)
-- Exécuter dans le SQL Editor de Supabase après nexora-complete.sql
-- =============================================

CREATE TABLE IF NOT EXISTS collaboration_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL DEFAULT 'Session partagée',
  invite_token VARCHAR(64) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  max_members SMALLINT DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) DEFAULT 'Développeur',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS collab_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name VARCHAR(100) NOT NULL DEFAULT 'Développeur',
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  model_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_collab_messages_room_created ON collab_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collab_messages_created ON collab_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_rooms_owner ON collaboration_rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_collab_rooms_token ON collaboration_rooms(invite_token);

-- Row Level Security
ALTER TABLE collaboration_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_messages ENABLE ROW LEVEL SECURITY;

-- Policies : collaboration_rooms
DROP POLICY IF EXISTS "Owner manages room" ON collaboration_rooms;
CREATE POLICY "Owner manages room" ON collaboration_rooms
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Members can view room" ON collaboration_rooms;
CREATE POLICY "Members can view room" ON collaboration_rooms
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = collaboration_rooms.id
      AND room_members.user_id = auth.uid()
  ));

-- Policies : room_members
DROP POLICY IF EXISTS "View members in same room" ON room_members;
CREATE POLICY "View members in same room" ON room_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Manage own membership" ON room_members;
CREATE POLICY "Manage own membership" ON room_members
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies : collab_messages
DROP POLICY IF EXISTS "Members read messages" ON collab_messages;
CREATE POLICY "Members read messages" ON collab_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = collab_messages.room_id
      AND room_members.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Members insert messages" ON collab_messages;
CREATE POLICY "Members insert messages" ON collab_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = collab_messages.room_id
        AND room_members.user_id = auth.uid()
    )
  );

-- Activer Supabase Realtime pour sync future (WebSocket)
ALTER PUBLICATION supabase_realtime ADD TABLE collab_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE room_members;
