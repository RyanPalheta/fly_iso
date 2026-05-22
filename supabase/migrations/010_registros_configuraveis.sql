-- =============================================================================
-- Fase D — Registros Configuráveis (ISO 9001 §7.5)
-- Cria tipos de registro (templates) com campos customizáveis e retenção.
-- =============================================================================

-- ─── 1. Tabela registro_tipos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registro_tipos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          varchar(50) UNIQUE NOT NULL,           -- ex: INSP_RECEB
  nome            varchar(255) NOT NULL,                  -- ex: Inspeção de Recebimento
  descricao       text,
  -- Campos customizáveis (array de { id, label, type, required, options? })
  campos          jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Retenção
  retencao_meses  integer NOT NULL DEFAULT 60,            -- 5 anos default
  descarte_acao   varchar(30) NOT NULL DEFAULT 'arquivar', -- arquivar | descartar | reter_indefinidamente
  ativo           boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registro_tipos_ativo ON registro_tipos(ativo) WHERE ativo = true;

-- ─── 2. Extensão da tabela registros ──────────────────────────────────────────
ALTER TABLE registros
  ADD COLUMN IF NOT EXISTS tipo_id        uuid REFERENCES registro_tipos(id),
  ADD COLUMN IF NOT EXISTS codigo         varchar(50),
  ADD COLUMN IF NOT EXISTS dados          jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS prazo_descarte date,
  ADD COLUMN IF NOT EXISTS arquivado_em   timestamptz;

CREATE INDEX IF NOT EXISTS idx_registros_tipo_id   ON registros(tipo_id);
CREATE INDEX IF NOT EXISTS idx_registros_prazo     ON registros(prazo_descarte) WHERE arquivado_em IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_registros_codigo_unq ON registros(codigo) WHERE codigo IS NOT NULL;

-- ─── 3. RLS para registro_tipos ───────────────────────────────────────────────
ALTER TABLE registro_tipos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registro_tipos_select"  ON registro_tipos;
DROP POLICY IF EXISTS "registro_tipos_admin"   ON registro_tipos;

-- Todos autenticados podem ler (precisam para criar registros)
CREATE POLICY "registro_tipos_select" ON registro_tipos
  FOR SELECT TO authenticated USING (true);

-- Só Admin/Qualidade podem escrever
CREATE POLICY "registro_tipos_admin" ON registro_tipos
  FOR ALL TO authenticated
  USING (is_admin_or_qualidade())
  WITH CHECK (is_admin_or_qualidade());

-- ─── 4. Trigger updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON registro_tipos;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON registro_tipos
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ─── 5. Tipos padrão (exemplos para começar) ──────────────────────────────────
INSERT INTO registro_tipos (codigo, nome, descricao, campos, retencao_meses, descarte_acao) VALUES
  (
    'INSP_RECEB',
    'Inspeção de Recebimento',
    'Registro de inspeção de matéria-prima e insumos recebidos de fornecedores.',
    '[
      {"id":"fornecedor","label":"Fornecedor","type":"text","required":true},
      {"id":"nota_fiscal","label":"Nota Fiscal","type":"text","required":true},
      {"id":"lote","label":"Lote / Batch","type":"text","required":true},
      {"id":"quantidade","label":"Quantidade","type":"number","required":true},
      {"id":"conforme","label":"Material Conforme?","type":"boolean","required":true},
      {"id":"observacoes","label":"Observações","type":"textarea","required":false},
      {"id":"anexos","label":"Evidências (fotos, laudos)","type":"files","required":false}
    ]'::jsonb,
    60,
    'arquivar'
  ),
  (
    'CALIB',
    'Registro de Calibração',
    'Registro periódico de calibração de instrumentos de medição.',
    '[
      {"id":"instrumento","label":"Instrumento","type":"text","required":true},
      {"id":"identificacao","label":"Identificação / TAG","type":"text","required":true},
      {"id":"data_calibracao","label":"Data da Calibração","type":"date","required":true},
      {"id":"proxima_calibracao","label":"Próxima Calibração","type":"date","required":true},
      {"id":"laboratorio","label":"Laboratório / Executante","type":"text","required":true},
      {"id":"resultado","label":"Resultado","type":"select","required":true,"options":["Aprovado","Aprovado com restrição","Reprovado"]},
      {"id":"certificado","label":"Certificado","type":"files","required":true}
    ]'::jsonb,
    120,  -- 10 anos
    'arquivar'
  ),
  (
    'REUNIAO',
    'Ata de Reunião',
    'Registro de reuniões operacionais, de qualidade ou de análise crítica.',
    '[
      {"id":"assunto","label":"Assunto","type":"text","required":true},
      {"id":"data_reuniao","label":"Data","type":"date","required":true},
      {"id":"local","label":"Local","type":"text","required":false},
      {"id":"participantes","label":"Participantes","type":"textarea","required":true},
      {"id":"pauta","label":"Pauta","type":"textarea","required":true},
      {"id":"decisoes","label":"Decisões / Encaminhamentos","type":"textarea","required":true},
      {"id":"anexos","label":"Documentos anexos","type":"files","required":false}
    ]'::jsonb,
    60,
    'arquivar'
  )
ON CONFLICT (codigo) DO NOTHING;
