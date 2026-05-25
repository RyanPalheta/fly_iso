-- =============================================================================
-- Módulo Auditorias (ISO 9001 §9.2 — Auditoria Interna)
-- Inclui: checklists reusáveis com perguntas pesadas, execução com pontuação,
-- vínculo automático com NCs e suporte a múltiplos tipos de auditoria.
-- =============================================================================

-- ─── 1. Checklists (templates reusáveis) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria_checklists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      varchar(50) UNIQUE NOT NULL,
  nome        varchar(255) NOT NULL,
  descricao   text,
  tipo        varchar(50),                 -- interna | fornecedor | 5s | seguranca | livre
  perguntas   jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_checklists_ativo ON auditoria_checklists(ativo) WHERE ativo = true;

-- Estrutura de cada pergunta no JSONB:
-- {
--   "id": "q1",
--   "texto": "Os procedimentos estão atualizados?",
--   "clausula": "7.5.2",
--   "peso": 5,
--   "obrigatoria": true,
--   "opcoes": [
--     {"valor": "conforme",   "label": "Conforme",     "pontos": 5},
--     {"valor": "nc_menor",   "label": "NC Menor",     "pontos": 2},
--     {"valor": "nc_maior",   "label": "NC Maior",     "pontos": 0},
--     {"valor": "observacao", "label": "Observação",   "pontos": 4},
--     {"valor": "na",         "label": "N/A",          "pontos": null}
--   ]
-- }

-- ─── 2. Auditorias (execução) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditorias (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          varchar(50) UNIQUE NOT NULL,         -- AUD-2026-001
  titulo          varchar(255) NOT NULL,
  tipo            varchar(50) NOT NULL DEFAULT 'interna', -- interna | fornecedor | 5s | seguranca
  escopo          text,                                 -- ex: "Linha A, Cláusulas 7-8"
  criterios       text,                                 -- ex: "ISO 9001:2015 + PCQ"

  -- Planejamento
  data_planejada  date,
  data_realizada  date,

  -- Equipe
  auditor_lider_id uuid REFERENCES usuarios(id),
  auditores        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- array de uuids

  -- Escopo (área principal)
  area_id          uuid REFERENCES areas(id),
  unidade_id       uuid REFERENCES unidades(id),

  -- Checklists usados (referência aos templates)
  checklist_ids    jsonb NOT NULL DEFAULT '[]'::jsonb,  -- array de uuids

  -- Status + resultado
  status          varchar(20) NOT NULL DEFAULT 'planejada',
    -- planejada | em_execucao | concluida | cancelada
  resultado_resumo text,
  pontuacao_total integer DEFAULT 0,
  pontuacao_max   integer DEFAULT 0,

  created_by      uuid REFERENCES usuarios(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  concluida_em    timestamptz
);
CREATE INDEX IF NOT EXISTS idx_auditorias_status ON auditorias(status);
CREATE INDEX IF NOT EXISTS idx_auditorias_data_planejada ON auditorias(data_planejada);

-- ─── 3. Respostas (execução do checklist na auditoria) ────────────────────────
CREATE TABLE IF NOT EXISTS auditoria_respostas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auditoria_id    uuid NOT NULL REFERENCES auditorias(id) ON DELETE CASCADE,
  checklist_id    uuid NOT NULL REFERENCES auditoria_checklists(id),
  pergunta_id     varchar(50) NOT NULL,                 -- ID dentro do JSONB
  pergunta_snapshot jsonb,                              -- snapshot da pergunta no momento

  resposta_valor  varchar(50),                          -- conforme | nc_menor | nc_maior | observacao | na | etc.
  pontos          integer,                              -- pontos atribuídos
  observacao      text,
  evidencias      jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{url, nome}]
  nc_id           uuid REFERENCES nao_conformidades(id),

  respondido_por  uuid REFERENCES usuarios(id),
  respondido_em   timestamptz,

  UNIQUE (auditoria_id, checklist_id, pergunta_id)
);
CREATE INDEX IF NOT EXISTS idx_resp_auditoria ON auditoria_respostas(auditoria_id);
CREATE INDEX IF NOT EXISTS idx_resp_nc        ON auditoria_respostas(nc_id);

-- ─── 4. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE auditoria_checklists  ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditorias            ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_respostas   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklists_select"   ON auditoria_checklists;
DROP POLICY IF EXISTS "checklists_admin"    ON auditoria_checklists;
DROP POLICY IF EXISTS "auditorias_select"   ON auditorias;
DROP POLICY IF EXISTS "auditorias_write"    ON auditorias;
DROP POLICY IF EXISTS "respostas_select"    ON auditoria_respostas;
DROP POLICY IF EXISTS "respostas_write"     ON auditoria_respostas;

CREATE POLICY "checklists_select" ON auditoria_checklists
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "checklists_admin" ON auditoria_checklists
  FOR ALL TO authenticated
  USING (is_admin_or_qualidade()) WITH CHECK (is_admin_or_qualidade());

CREATE POLICY "auditorias_select" ON auditorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "auditorias_write"  ON auditorias FOR ALL    TO authenticated
  USING (is_admin_or_qualidade()) WITH CHECK (is_admin_or_qualidade());

CREATE POLICY "respostas_select" ON auditoria_respostas FOR SELECT TO authenticated USING (true);
CREATE POLICY "respostas_write"  ON auditoria_respostas FOR ALL    TO authenticated
  USING (true) WITH CHECK (true);  -- auditor pode responder (lider, auditores, qualidade)

-- ─── 5. Trigger updated_at ────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS set_updated_at_checklists ON auditoria_checklists;
CREATE TRIGGER set_updated_at_checklists
  BEFORE UPDATE ON auditoria_checklists
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_auditorias ON auditorias;
CREATE TRIGGER set_updated_at_auditorias
  BEFORE UPDATE ON auditorias
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ─── 6. Checklists padrão ─────────────────────────────────────────────────────
INSERT INTO auditoria_checklists (codigo, nome, descricao, tipo, perguntas) VALUES
  (
    'ISO9001_CL7',
    'ISO 9001:2015 — Cláusula 7 (Apoio)',
    'Checklist para auditar requisitos de Apoio: recursos, competência, conscientização, comunicação e informação documentada.',
    'interna',
    '[
      {"id":"7.1.5_a","texto":"Os recursos de monitoramento e medição estão identificados e calibrados?","clausula":"7.1.5","peso":5,"obrigatoria":true,"opcoes":[
        {"valor":"conforme","label":"Conforme","pontos":5},
        {"valor":"nc_menor","label":"NC Menor","pontos":2},
        {"valor":"nc_maior","label":"NC Maior","pontos":0},
        {"valor":"observacao","label":"Observação","pontos":4},
        {"valor":"na","label":"N/A","pontos":null}
      ]},
      {"id":"7.2_a","texto":"As competências necessárias estão definidas para cada função?","clausula":"7.2","peso":5,"obrigatoria":true,"opcoes":[
        {"valor":"conforme","label":"Conforme","pontos":5},
        {"valor":"nc_menor","label":"NC Menor","pontos":2},
        {"valor":"nc_maior","label":"NC Maior","pontos":0},
        {"valor":"observacao","label":"Observação","pontos":4},
        {"valor":"na","label":"N/A","pontos":null}
      ]},
      {"id":"7.2_b","texto":"Os treinamentos estão registrados e a eficácia é avaliada?","clausula":"7.2","peso":5,"obrigatoria":true,"opcoes":[
        {"valor":"conforme","label":"Conforme","pontos":5},
        {"valor":"nc_menor","label":"NC Menor","pontos":2},
        {"valor":"nc_maior","label":"NC Maior","pontos":0},
        {"valor":"observacao","label":"Observação","pontos":4},
        {"valor":"na","label":"N/A","pontos":null}
      ]},
      {"id":"7.5.2","texto":"Os documentos estão devidamente identificados (título, data, autor, revisão)?","clausula":"7.5.2","peso":3,"obrigatoria":true,"opcoes":[
        {"valor":"conforme","label":"Conforme","pontos":3},
        {"valor":"nc_menor","label":"NC Menor","pontos":1},
        {"valor":"nc_maior","label":"NC Maior","pontos":0},
        {"valor":"observacao","label":"Observação","pontos":2},
        {"valor":"na","label":"N/A","pontos":null}
      ]},
      {"id":"7.5.3","texto":"O controle de informação documentada garante: acesso, integridade, retenção e descarte?","clausula":"7.5.3","peso":5,"obrigatoria":true,"opcoes":[
        {"valor":"conforme","label":"Conforme","pontos":5},
        {"valor":"nc_menor","label":"NC Menor","pontos":2},
        {"valor":"nc_maior","label":"NC Maior","pontos":0},
        {"valor":"observacao","label":"Observação","pontos":4},
        {"valor":"na","label":"N/A","pontos":null}
      ]}
    ]'::jsonb
  ),
  (
    'CHK_5S',
    'Checklist 5S — Auditoria de Posto de Trabalho',
    'Avaliação dos 5 sensos: Seiri, Seiton, Seiso, Seiketsu, Shitsuke.',
    '5s',
    '[
      {"id":"seiri","texto":"SEIRI (Senso de Utilização): área livre de itens desnecessários?","clausula":"5S-1","peso":4,"obrigatoria":true,"opcoes":[
        {"valor":"otimo","label":"Ótimo","pontos":4},
        {"valor":"bom","label":"Bom","pontos":3},
        {"valor":"regular","label":"Regular","pontos":2},
        {"valor":"ruim","label":"Ruim","pontos":1},
        {"valor":"critico","label":"Crítico","pontos":0}
      ]},
      {"id":"seiton","texto":"SEITON (Senso de Organização): cada coisa em seu lugar, identificado?","clausula":"5S-2","peso":4,"obrigatoria":true,"opcoes":[
        {"valor":"otimo","label":"Ótimo","pontos":4},
        {"valor":"bom","label":"Bom","pontos":3},
        {"valor":"regular","label":"Regular","pontos":2},
        {"valor":"ruim","label":"Ruim","pontos":1},
        {"valor":"critico","label":"Crítico","pontos":0}
      ]},
      {"id":"seiso","texto":"SEISO (Senso de Limpeza): área limpa e mantida?","clausula":"5S-3","peso":4,"obrigatoria":true,"opcoes":[
        {"valor":"otimo","label":"Ótimo","pontos":4},
        {"valor":"bom","label":"Bom","pontos":3},
        {"valor":"regular","label":"Regular","pontos":2},
        {"valor":"ruim","label":"Ruim","pontos":1},
        {"valor":"critico","label":"Crítico","pontos":0}
      ]},
      {"id":"seiketsu","texto":"SEIKETSU (Senso de Padronização): padrões visíveis e seguidos?","clausula":"5S-4","peso":4,"obrigatoria":true,"opcoes":[
        {"valor":"otimo","label":"Ótimo","pontos":4},
        {"valor":"bom","label":"Bom","pontos":3},
        {"valor":"regular","label":"Regular","pontos":2},
        {"valor":"ruim","label":"Ruim","pontos":1},
        {"valor":"critico","label":"Crítico","pontos":0}
      ]},
      {"id":"shitsuke","texto":"SHITSUKE (Senso de Autodisciplina): equipe pratica naturalmente?","clausula":"5S-5","peso":4,"obrigatoria":true,"opcoes":[
        {"valor":"otimo","label":"Ótimo","pontos":4},
        {"valor":"bom","label":"Bom","pontos":3},
        {"valor":"regular","label":"Regular","pontos":2},
        {"valor":"ruim","label":"Ruim","pontos":1},
        {"valor":"critico","label":"Crítico","pontos":0}
      ]}
    ]'::jsonb
  )
ON CONFLICT (codigo) DO NOTHING;
