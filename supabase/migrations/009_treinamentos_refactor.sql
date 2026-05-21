-- =============================================================
-- Migration 009 — Fase C.1: Refactor de Treinamentos
-- =============================================================
-- Apontamento do auditor:
--   Separar Treinamento INTERNO × EXTERNO em produtos independentes
--   (mesma plataforma, navegação separada, campos específicos por tipo).
-- =============================================================

-- ── 1. treinamentos: novos campos ────────────────────────────────────
ALTER TABLE treinamentos
  ADD COLUMN IF NOT EXISTS categoria       VARCHAR(20) DEFAULT 'interno',
  ADD COLUMN IF NOT EXISTS revisao_doc     INTEGER,
  ADD COLUMN IF NOT EXISTS entidade_promotora TEXT,
  ADD COLUMN IF NOT EXISTS carga_horaria   INTEGER,
  ADD COLUMN IF NOT EXISTS mes_planejado   VARCHAR(7),   -- 'YYYY-MM'
  ADD COLUMN IF NOT EXISTS custo           DECIMAL(10,2);

-- Backfill: tudo existente como interno
UPDATE treinamentos SET categoria = 'interno' WHERE categoria IS NULL;
ALTER TABLE treinamentos ALTER COLUMN categoria SET NOT NULL;

COMMENT ON COLUMN treinamentos.categoria IS
  '"interno" = vinculado a documento + colaboradores; "externo" = fornecedor externo.';
COMMENT ON COLUMN treinamentos.revisao_doc IS
  'Snapshot da revisão do documento no momento do treinamento (req. retreinamento).';
COMMENT ON COLUMN treinamentos.mes_planejado IS
  'Para externos: mês previsto no Plano Anual (YYYY-MM).';

CREATE INDEX IF NOT EXISTS idx_treinamentos_categoria ON treinamentos(categoria);
CREATE INDEX IF NOT EXISTS idx_treinamentos_documento ON treinamentos(documento_id);

-- ── 2. treinamento_participantes: campos auditor ────────────────────
ALTER TABLE treinamento_participantes
  ADD COLUMN IF NOT EXISTS nome_snapshot     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS matricula         VARCHAR(50),
  ADD COLUMN IF NOT EXISTS setor             VARCHAR(255),
  ADD COLUMN IF NOT EXISTS turno             VARCHAR(50);   -- 'manha'|'tarde'|'noite'|'integral'

COMMENT ON COLUMN treinamento_participantes.nome_snapshot IS
  'Nome no momento da participação (usado se usuario_id é null - colaborador externo).';
COMMENT ON COLUMN treinamento_participantes.turno IS
  'manha | tarde | noite | integral';

-- ── 3. Nova tabela: LNT (Levantamento de Necessidade de Treinamento) ─
CREATE TABLE IF NOT EXISTS treinamento_lnt (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id         UUID        REFERENCES areas(id) ON DELETE CASCADE,
  ano             INTEGER     NOT NULL,
  treinamento_nome TEXT       NOT NULL,
  descricao       TEXT,
  justificativa   TEXT,
  prioridade      VARCHAR(20) DEFAULT 'media',   -- 'alta'|'media'|'baixa'
  qtd_pessoas     INTEGER     DEFAULT 1,
  carga_horaria_estimada INTEGER,
  status          VARCHAR(30) DEFAULT 'identificada',
  -- identificada | aprovada | planejada | em_execucao | concluida | cancelada
  treinamento_id  UUID        REFERENCES treinamentos(id), -- quando vira treinamento real
  criado_por      UUID        REFERENCES usuarios(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lnt_area_ano ON treinamento_lnt(area_id, ano);
CREATE INDEX IF NOT EXISTS idx_lnt_status   ON treinamento_lnt(status);

COMMENT ON TABLE treinamento_lnt IS
  'Levantamento de Necessidade de Treinamento — Plano Anual (req. auditor).';

ALTER TABLE treinamento_lnt ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lnt_select" ON treinamento_lnt;
CREATE POLICY "lnt_select" ON treinamento_lnt FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "lnt_write" ON treinamento_lnt;
CREATE POLICY "lnt_write"  ON treinamento_lnt FOR ALL USING (auth.role() = 'authenticated');

-- ── 4. Nova tabela: Avaliação de Eficácia ────────────────────────────
CREATE TABLE IF NOT EXISTS treinamento_avaliacao_eficacia (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  treinamento_id    UUID        NOT NULL REFERENCES treinamentos(id) ON DELETE CASCADE,
  participante_id   UUID        REFERENCES treinamento_participantes(id) ON DELETE SET NULL,
  -- (null = avaliação geral; preenchido = avaliação individual)
  data_avaliacao    DATE        NOT NULL DEFAULT CURRENT_DATE,
  eficaz            BOOLEAN     NOT NULL,
  observacao        TEXT        NOT NULL,
  evidencia_urls    JSONB       DEFAULT '[]',
  avaliado_por      UUID        REFERENCES usuarios(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_av_eficacia_treinamento ON treinamento_avaliacao_eficacia(treinamento_id);

COMMENT ON TABLE treinamento_avaliacao_eficacia IS
  'Avaliação de eficácia do treinamento (req. auditor: obrigatória se ineficaz).';

ALTER TABLE treinamento_avaliacao_eficacia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "av_ef_select" ON treinamento_avaliacao_eficacia;
CREATE POLICY "av_ef_select" ON treinamento_avaliacao_eficacia FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "av_ef_write" ON treinamento_avaliacao_eficacia;
CREATE POLICY "av_ef_write"  ON treinamento_avaliacao_eficacia FOR ALL USING (auth.role() = 'authenticated');
