-- =============================================================
-- Migration 008 — Distribuição de Documentos (Fase B)
-- =============================================================
-- Apontamento do auditor:
--   Distribuição tem TIPO (Eletrônica/Cópia Controlada) + unidades + setores.
-- A tabela `distribuicao` original (versao_id + usuario_id) é mantida como
-- "aceite eletrônico" individual. Esta nova tabela captura o ESCOPO da
-- distribuição: para QUAIS unidades/áreas o documento foi liberado e em
-- QUAL formato (eletrônico ou cópia física controlada).
-- =============================================================

CREATE TABLE IF NOT EXISTS distribuicao_documento (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id      UUID        NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  versao_id         UUID        REFERENCES versoes(id) ON DELETE SET NULL,
  tipo              VARCHAR(30) NOT NULL,    -- 'eletronica' | 'copia_controlada'
  unidade_id        UUID        REFERENCES unidades(id) ON DELETE CASCADE,
  area_id           UUID        REFERENCES areas(id) ON DELETE CASCADE,
  numero_copia      TEXT,                    -- número de série da cópia controlada
  destinatario_id   UUID        REFERENCES usuarios(id),  -- responsável pela cópia (opcional)
  data_distribuicao DATE        NOT NULL DEFAULT CURRENT_DATE,
  observacao        TEXT,
  distribuido_por   UUID        REFERENCES usuarios(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dist_doc_documento ON distribuicao_documento(documento_id);
CREATE INDEX IF NOT EXISTS idx_dist_doc_versao    ON distribuicao_documento(versao_id);
CREATE INDEX IF NOT EXISTS idx_dist_doc_unidade   ON distribuicao_documento(unidade_id);

COMMENT ON COLUMN distribuicao_documento.tipo IS
  'eletronica = acesso via sistema; copia_controlada = registro físico rastreável.';
COMMENT ON COLUMN distribuicao_documento.numero_copia IS
  'Número de série da cópia física (ex: "COPIA-001/2026"). Obrigatório para copia_controlada.';

-- ── RLS ──
ALTER TABLE distribuicao_documento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dist_doc_select" ON distribuicao_documento;
CREATE POLICY "dist_doc_select" ON distribuicao_documento
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "dist_doc_write" ON distribuicao_documento;
CREATE POLICY "dist_doc_write" ON distribuicao_documento
  FOR ALL USING (auth.role() = 'authenticated');
