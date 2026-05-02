-- Notifications table
CREATE TABLE IF NOT EXISTS notificacoes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  mensagem     TEXT,
  tipo         TEXT NOT NULL DEFAULT 'info',  -- 'info' | 'alerta' | 'erro' | 'sucesso'
  lida         BOOLEAN NOT NULL DEFAULT false,
  entidade     TEXT,      -- 'nao_conformidades' | 'capas' | etc.
  entidade_id  UUID,      -- FK to the entity
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id, lida, created_at DESC);

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
DROP POLICY IF EXISTS "notificacoes_select" ON notificacoes;
CREATE POLICY "notificacoes_select" ON notificacoes
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "notificacoes_update" ON notificacoes;
CREATE POLICY "notificacoes_update" ON notificacoes
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "notificacoes_service_insert" ON notificacoes;
CREATE POLICY "notificacoes_service_insert" ON notificacoes
  FOR INSERT WITH CHECK (true);  -- service_role can insert for any user
