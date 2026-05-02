-- =============================================================
-- Fly ISO — Schema Inicial (PostgreSQL / Supabase)
-- =============================================================

-- -------------------------------------------------------
-- 1. Estrutura Organizacional
-- -------------------------------------------------------
CREATE TABLE unidades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR(255) NOT NULL,
  codigo      VARCHAR(50),
  ativa       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR(255) NOT NULL,
  unidade_id  UUID REFERENCES unidades(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- 2. Auth & RBAC
-- -------------------------------------------------------
CREATE TABLE perfis (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR(100) NOT NULL,  -- Admin, Qualidade, Lider, Usuario, Auditor
  descricao   TEXT,
  permissoes  JSONB NOT NULL DEFAULT '{}',
  -- Ex: {"documentos":["view","create","edit","approve"],"nc":["view","create"]}
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  perfil_id   UUID REFERENCES perfis(id),
  ativo       BOOLEAN DEFAULT true,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE usuario_unidades (
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  unidade_id  UUID REFERENCES unidades(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, unidade_id)
);

-- -------------------------------------------------------
-- 3. Document Control
-- -------------------------------------------------------
CREATE TABLE documentos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo           VARCHAR(50) NOT NULL UNIQUE,
  titulo           VARCHAR(500) NOT NULL,
  tipo             VARCHAR(50),
  -- Procedimento, Instrucao, Formulario, Manual, Politica, Registro
  descricao        TEXT,
  area_id          UUID REFERENCES areas(id),
  responsavel_id   UUID REFERENCES usuarios(id),
  status           VARCHAR(50) DEFAULT 'rascunho',
  -- rascunho, em_revisao, aprovado, obsoleto
  revisao_atual    INTEGER DEFAULT 0,
  tags             TEXT[],
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE versoes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id         UUID REFERENCES documentos(id) ON DELETE CASCADE,
  numero_revisao       INTEGER NOT NULL,
  arquivo_url          TEXT,
  arquivo_nome         TEXT,
  descricao_alteracao  TEXT,
  criado_por           UUID REFERENCES usuarios(id),
  aprovado_por         UUID REFERENCES usuarios(id),
  aprovado_em          TIMESTAMPTZ,
  status               VARCHAR(50) DEFAULT 'pendente',
  -- pendente, em_revisao, aprovado, rejeitado
  comentarios          TEXT,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE aprovacao_fluxo (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versao_id     UUID REFERENCES versoes(id) ON DELETE CASCADE,
  etapa         VARCHAR(50) NOT NULL,  -- revisor, aprovador
  usuario_id    UUID REFERENCES usuarios(id),
  status        VARCHAR(50) DEFAULT 'pendente',
  -- pendente, aprovado, rejeitado
  comentario    TEXT,
  respondido_em TIMESTAMPTZ,
  ordem         INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE distribuicao (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versao_id   UUID REFERENCES versoes(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES usuarios(id),
  lido        BOOLEAN DEFAULT false,
  lido_em     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- 4. Indicadores / KPIs  (antes das NCs para FK)
-- -------------------------------------------------------
CREATE TABLE indicadores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                VARCHAR(50) UNIQUE,
  nome                  VARCHAR(255) NOT NULL,
  descricao             TEXT,
  formula               TEXT,
  unidade_medida        VARCHAR(50),
  meta                  DECIMAL(10,2),
  frequencia            VARCHAR(50),  -- mensal, trimestral, semestral, anual
  area_id               UUID REFERENCES areas(id),
  responsavel_id        UUID REFERENCES usuarios(id),
  gerar_nc_abaixo_meta  BOOLEAN DEFAULT false,
  ativo                 BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- 5. Não Conformidades (NC)
-- -------------------------------------------------------
CREATE TABLE nao_conformidades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          VARCHAR(50) NOT NULL UNIQUE,
  titulo          VARCHAR(500) NOT NULL,
  descricao       TEXT NOT NULL,
  area_id         UUID REFERENCES areas(id),
  documento_id    UUID REFERENCES documentos(id),
  indicador_id    UUID REFERENCES indicadores(id),
  detectado_por   UUID REFERENCES usuarios(id),
  responsavel_id  UUID REFERENCES usuarios(id),
  severidade      VARCHAR(20),  -- menor, maior, critica
  origem          VARCHAR(50),
  -- auditoria_interna, auditoria_externa, cliente, processo, indicador
  status          VARCHAR(50) DEFAULT 'registrada',
  -- registrada, em_analise, em_acao, verificacao, encerrada
  evidencia_urls  JSONB DEFAULT '[]',
  requisito_violado TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  encerrada_em    TIMESTAMPTZ
);

-- -------------------------------------------------------
-- 6. CAPA
-- -------------------------------------------------------
CREATE TABLE capas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo               VARCHAR(50) NOT NULL UNIQUE,
  nc_id                UUID REFERENCES nao_conformidades(id),
  tipo                 VARCHAR(20) NOT NULL,  -- corretiva, preventiva
  descricao            TEXT,
  responsavel_id       UUID REFERENCES usuarios(id),
  causa_raiz_metodo    VARCHAR(50),  -- 5_porques, ishikawa, texto_livre
  causa_raiz_dados     JSONB DEFAULT '{}',
  -- 5_porques: [{ordem:1,porque:"...",resposta:"..."}]
  -- ishikawa: {man:[...],machine:[...],method:[...],material:[...],measurement:[...],environment:[...]}
  status               VARCHAR(50) DEFAULT 'aberta',
  -- aberta, em_investigacao, plano_definido, em_execucao, verificacao, encerrada, reaberta
  prazo_geral          DATE,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  encerrada_em         TIMESTAMPTZ
);

CREATE TABLE acoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capa_id         UUID REFERENCES capas(id) ON DELETE CASCADE,
  descricao       TEXT NOT NULL,
  responsavel_id  UUID REFERENCES usuarios(id),
  prazo           DATE,
  status          VARCHAR(50) DEFAULT 'pendente',
  -- pendente, em_andamento, concluida, cancelada
  evidencia_urls  JSONB DEFAULT '[]',
  concluida_em    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE verificacoes_eficacia (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capa_id          UUID REFERENCES capas(id) ON DELETE CASCADE,
  verificado_por   UUID REFERENCES usuarios(id),
  data_verificacao DATE,
  eficaz           BOOLEAN,
  observacoes      TEXT,
  evidencia_urls   JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- 7. Treinamentos
-- -------------------------------------------------------
CREATE TABLE treinamentos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id     UUID REFERENCES documentos(id),
  titulo           VARCHAR(500) NOT NULL,
  descricao        TEXT,
  instrutor        VARCHAR(255),
  data_treinamento DATE,
  validade_meses   INTEGER,
  area_id          UUID REFERENCES areas(id),
  tipo             VARCHAR(50) DEFAULT 'presencial',
  -- presencial, online, leitura
  status           VARCHAR(50) DEFAULT 'planejado',
  -- planejado, realizado, cancelado
  evidencia_url    TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treinamento_participantes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treinamento_id  UUID REFERENCES treinamentos(id) ON DELETE CASCADE,
  usuario_id      UUID REFERENCES usuarios(id),
  status          VARCHAR(50) DEFAULT 'pendente',
  -- pendente, concluido, ausente
  certificado_url TEXT,
  aceite_digital  BOOLEAN DEFAULT false,
  aceite_em       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- 8. Resultados de Indicadores
-- -------------------------------------------------------
CREATE TABLE resultados_indicadores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id    UUID REFERENCES indicadores(id) ON DELETE CASCADE,
  periodo         VARCHAR(20) NOT NULL,  -- 2026-01, 2026-Q1, etc.
  valor           DECIMAL(10,2) NOT NULL,
  observacoes     TEXT,
  evidencia_url   TEXT,
  nc_gerada_id    UUID REFERENCES nao_conformidades(id),
  registrado_por  UUID REFERENCES usuarios(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- 9. Registros (Records Management)
-- -------------------------------------------------------
CREATE TABLE politicas_retencao (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_registro         VARCHAR(100) NOT NULL,
  periodo_retencao_meses INTEGER NOT NULL,
  metodo_descarte       VARCHAR(100),  -- arquivar, destruir, revisar
  descricao             TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE registros (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo            VARCHAR(500) NOT NULL,
  tipo              VARCHAR(100),
  politica_id       UUID REFERENCES politicas_retencao(id),
  documento_id      UUID REFERENCES documentos(id),
  area_id           UUID REFERENCES areas(id),
  responsavel_id    UUID REFERENCES usuarios(id),
  arquivo_url       TEXT,
  status            VARCHAR(50) DEFAULT 'ativo',  -- ativo, arquivado, descartado
  data_criacao      DATE DEFAULT CURRENT_DATE,
  data_arquivamento DATE,
  data_descarte     DATE,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- 10. Análise Crítica (Management Review)
-- -------------------------------------------------------
CREATE TABLE reunioes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo         VARCHAR(500) NOT NULL,
  data           DATE NOT NULL,
  status         VARCHAR(50) DEFAULT 'planejada',
  -- planejada, em_andamento, concluida
  ata            TEXT,
  participantes  UUID[] DEFAULT '{}',
  created_by     UUID REFERENCES usuarios(id),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE checklist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id  UUID REFERENCES reunioes(id) ON DELETE CASCADE,
  item_iso    VARCHAR(500) NOT NULL,
  descricao   TEXT,
  status      VARCHAR(50) DEFAULT 'pendente',
  -- pendente, abordado, nao_aplicavel
  observacoes TEXT,
  evidencia   TEXT,
  ordem       INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reuniao_acoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id      UUID REFERENCES reunioes(id) ON DELETE CASCADE,
  descricao       TEXT NOT NULL,
  responsavel_id  UUID REFERENCES usuarios(id),
  prazo           DATE,
  status          VARCHAR(50) DEFAULT 'pendente',
  -- pendente, em_andamento, concluida
  capa_id         UUID REFERENCES capas(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- 11. Audit Log (global)
-- -------------------------------------------------------
CREATE TABLE audit_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID REFERENCES usuarios(id),
  acao             VARCHAR(50) NOT NULL,
  -- create, update, delete, approve, reject, view, export
  entidade         VARCHAR(100) NOT NULL,
  -- documentos, nao_conformidades, capas, treinamentos, etc.
  entidade_id      UUID,
  dados_anteriores JSONB,
  dados_novos      JSONB,
  ip_address       INET,
  user_agent       TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- 12. Importação de Dados
-- -------------------------------------------------------
CREATE TABLE importacoes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arquivo_nome        VARCHAR(500),
  arquivo_url         TEXT,
  tipo_entidade       VARCHAR(100),
  mapeamento          JSONB DEFAULT '{}',
  status              VARCHAR(50) DEFAULT 'pendente',
  -- pendente, processando, concluida, erro
  total_registros     INTEGER DEFAULT 0,
  registros_importados INTEGER DEFAULT 0,
  registros_erro      INTEGER DEFAULT 0,
  score_qualidade     DECIMAL(5,2),
  log_erros           JSONB DEFAULT '[]',
  importado_por       UUID REFERENCES usuarios(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  concluida_em        TIMESTAMPTZ
);

-- =============================================================
-- ÍNDICES
-- =============================================================
CREATE INDEX idx_documentos_area       ON documentos(area_id);
CREATE INDEX idx_documentos_status     ON documentos(status);
CREATE INDEX idx_documentos_codigo     ON documentos(codigo);
CREATE INDEX idx_versoes_documento     ON versoes(documento_id);
CREATE INDEX idx_nc_status             ON nao_conformidades(status);
CREATE INDEX idx_nc_area               ON nao_conformidades(area_id);
CREATE INDEX idx_nc_responsavel        ON nao_conformidades(responsavel_id);
CREATE INDEX idx_capas_nc              ON capas(nc_id);
CREATE INDEX idx_capas_status          ON capas(status);
CREATE INDEX idx_acoes_capa            ON acoes(capa_id);
CREATE INDEX idx_acoes_responsavel     ON acoes(responsavel_id);
CREATE INDEX idx_treinamentos_area     ON treinamentos(area_id);
CREATE INDEX idx_indicadores_area      ON indicadores(area_id);
CREATE INDEX idx_resultados_indicador  ON resultados_indicadores(indicador_id);
CREATE INDEX idx_audit_entidade        ON audit_log(entidade, entidade_id);
CREATE INDEX idx_audit_usuario         ON audit_log(usuario_id);
CREATE INDEX idx_audit_created         ON audit_log(created_at DESC);
CREATE INDEX idx_reunioes_data         ON reunioes(data DESC);
CREATE INDEX idx_registros_status      ON registros(status);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE documentos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE versoes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE nao_conformidades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE capas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE acoes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinamentos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reunioes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios               ENABLE ROW LEVEL SECURITY;

-- Helper: verifica se o usuário tem perfil Admin ou Qualidade
CREATE OR REPLACE FUNCTION is_admin_or_qualidade()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    JOIN perfis p ON p.id = u.perfil_id
    WHERE u.id = auth.uid()
    AND p.nome IN ('Admin', 'Qualidade')
  );
$$;

-- Helper: unidades do usuário logado
CREATE OR REPLACE FUNCTION minha_unidades()
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT unidade_id FROM usuario_unidades WHERE usuario_id = auth.uid();
$$;

-- Documentos: Admin/Qualidade vê tudo; outros veem sua unidade
CREATE POLICY "admin_qualidade_documentos_all" ON documentos
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_documentos_unidade" ON documentos
  FOR SELECT USING (
    area_id IN (
      SELECT a.id FROM areas a WHERE a.unidade_id IN (SELECT minha_unidades())
    )
  );

-- NCs: Admin/Qualidade vê tudo; Líder vê sua área
CREATE POLICY "admin_qualidade_nc_all" ON nao_conformidades
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_nc_unidade" ON nao_conformidades
  FOR SELECT USING (
    area_id IN (
      SELECT a.id FROM areas a WHERE a.unidade_id IN (SELECT minha_unidades())
    )
  );

-- CAPAs seguem a mesma lógica via NC vinculada
CREATE POLICY "admin_qualidade_capa_all" ON capas
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_capa_via_nc" ON capas
  FOR SELECT USING (
    nc_id IN (
      SELECT id FROM nao_conformidades WHERE
        area_id IN (
          SELECT a.id FROM areas a WHERE a.unidade_id IN (SELECT minha_unidades())
        )
    )
  );

-- Usuários: cada um vê seu próprio registro; admin vê todos
CREATE POLICY "usuario_proprio" ON usuarios
  FOR SELECT USING (id = auth.uid() OR is_admin_or_qualidade());

CREATE POLICY "admin_usuarios_all" ON usuarios
  FOR ALL USING (is_admin_or_qualidade());

-- =============================================================
-- SEED: Perfis padrão + 12 inputs ISO
-- =============================================================

-- Perfis RBAC
INSERT INTO perfis (nome, descricao, permissoes) VALUES
('Admin', 'Acesso total ao sistema', '{
  "documentos":   ["view","create","edit","delete","approve","export"],
  "treinamentos": ["view","create","edit","delete","export"],
  "nc":           ["view","create","edit","delete","close","export"],
  "capa":         ["view","create","edit","delete","verify","export"],
  "indicadores":  ["view","create","edit","delete","export"],
  "registros":    ["view","create","edit","delete","export"],
  "reunioes":     ["view","create","edit","delete","export"],
  "usuarios":     ["view","create","edit","delete"],
  "importacao":   ["view","create"]
}'),
('Qualidade', 'Gestão da qualidade — acesso a todos os módulos', '{
  "documentos":   ["view","create","edit","approve","export"],
  "treinamentos": ["view","create","edit","export"],
  "nc":           ["view","create","edit","close","export"],
  "capa":         ["view","create","edit","verify","export"],
  "indicadores":  ["view","create","edit","export"],
  "registros":    ["view","create","edit","export"],
  "reunioes":     ["view","create","edit","export"],
  "usuarios":     ["view"],
  "importacao":   ["view","create"]
}'),
('Lider', 'Líder de área — cria e revisa em seu escopo', '{
  "documentos":   ["view","create","edit"],
  "treinamentos": ["view","create","edit"],
  "nc":           ["view","create","edit"],
  "capa":         ["view","create","edit"],
  "indicadores":  ["view","create"],
  "registros":    ["view","create"],
  "reunioes":     ["view","edit"],
  "usuarios":     ["view"],
  "importacao":   []
}'),
('Usuario', 'Usuário padrão — abre NCs e confirma treinamentos', '{
  "documentos":   ["view"],
  "treinamentos": ["view","accept"],
  "nc":           ["view","create"],
  "capa":         ["view","execute"],
  "indicadores":  ["view"],
  "registros":    ["view"],
  "reunioes":     [],
  "usuarios":     ["view_self"],
  "importacao":   []
}'),
('Auditor', 'Read-only + exportar relatórios', '{
  "documentos":   ["view","export"],
  "treinamentos": ["view","export"],
  "nc":           ["view","export"],
  "capa":         ["view","export"],
  "indicadores":  ["view","export"],
  "registros":    ["view","export"],
  "reunioes":     ["view"],
  "usuarios":     [],
  "importacao":   []
}');

-- 12 Inputs ISO 9001:2015 — cláusula 9.3.2 (template para reuniões)
-- (usados como seed ao criar nova reunião)
CREATE TABLE iso_inputs_template (
  id     SERIAL PRIMARY KEY,
  ordem  INTEGER NOT NULL,
  titulo VARCHAR(500) NOT NULL,
  descricao TEXT
);

INSERT INTO iso_inputs_template (ordem, titulo, descricao) VALUES
(1,  'Status das ações de reuniões anteriores', 'Acompanhamento das decisões e ações da última análise crítica'),
(2,  'Mudanças em questões internas e externas', 'Alterações no contexto organizacional que afetam o SGQ'),
(3,  'Informações sobre desempenho e eficácia do SGQ', 'Visão geral da performance do sistema de gestão'),
(4,  'Satisfação do cliente e feedback', 'Resultados de pesquisas, reclamações e elogios de clientes'),
(5,  'Extensão em que objetivos foram atingidos', 'Grau de alcance dos objetivos da qualidade definidos'),
(6,  'Desempenho de processos e conformidade de produtos', 'Indicadores de processo e resultados de produto/serviço'),
(7,  'Não conformidades e ações corretivas', 'Volume, tipos e eficácia das NCs e CAPAs abertas'),
(8,  'Resultados de monitoramento e medição', 'KPIs e métricas de desempenho operacional'),
(9,  'Resultados de auditorias', 'Achados de auditorias internas e externas realizadas'),
(10, 'Desempenho de provedores externos', 'Avaliação de fornecedores e prestadores de serviço'),
(11, 'Adequação de recursos', 'Avaliação se os recursos disponíveis são suficientes'),
(12, 'Eficácia de ações para riscos e oportunidades', 'Resultado das ações tomadas em resposta a riscos/oportunidades identificados');
