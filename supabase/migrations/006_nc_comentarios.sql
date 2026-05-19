-- =============================================================
-- Migration 006 — Comentários em Não Conformidades
-- =============================================================

CREATE TABLE IF NOT EXISTS nc_comentarios (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nc_id       UUID        NOT NULL REFERENCES nao_conformidades(id) ON DELETE CASCADE,
  usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  texto       TEXT        NOT NULL,
  editado     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nc_comentarios_nc      ON nc_comentarios(nc_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nc_comentarios_usuario ON nc_comentarios(usuario_id);

-- ── RLS ──
ALTER TABLE nc_comentarios ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode LER comentários de qualquer NC
DROP POLICY IF EXISTS "nc_comentarios_select" ON nc_comentarios;
CREATE POLICY "nc_comentarios_select" ON nc_comentarios
  FOR SELECT USING (auth.role() = 'authenticated');

-- Qualquer usuário autenticado pode INSERIR (com usuario_id = auth.uid())
DROP POLICY IF EXISTS "nc_comentarios_insert" ON nc_comentarios;
CREATE POLICY "nc_comentarios_insert" ON nc_comentarios
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Só o autor pode atualizar / deletar
DROP POLICY IF EXISTS "nc_comentarios_update" ON nc_comentarios;
CREATE POLICY "nc_comentarios_update" ON nc_comentarios
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "nc_comentarios_delete" ON nc_comentarios;
CREATE POLICY "nc_comentarios_delete" ON nc_comentarios
  FOR DELETE USING (auth.uid() = usuario_id);
