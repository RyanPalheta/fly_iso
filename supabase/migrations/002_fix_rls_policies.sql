-- ============================================================
-- Fly ISO — RLS policies faltantes (002_fix_rls_policies.sql)
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Helper reutilizável (cria ou substitui)
CREATE OR REPLACE FUNCTION is_admin_or_qualidade()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    JOIN perfis p ON p.id = u.perfil_id
    WHERE u.id = auth.uid()
    AND p.nome IN ('Admin', 'Qualidade')
  );
$$;

-- ── acoes (ações do plano de CAPA) ──────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_acoes_all"  ON acoes;
DROP POLICY IF EXISTS "usuario_acoes_via_capa"     ON acoes;

CREATE POLICY "admin_qualidade_acoes_all" ON acoes
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_acoes_via_capa" ON acoes
  FOR SELECT USING (
    capa_id IN (
      SELECT id FROM capas WHERE nc_id IN (
        SELECT id FROM nao_conformidades WHERE area_id IN (
          SELECT a.id FROM areas a WHERE a.unidade_id IN (
            SELECT unidade_id FROM usuario_unidades WHERE usuario_id = auth.uid()
          )
        )
      )
    )
  );

-- ── versoes (versões de documentos) ─────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_versoes_all" ON versoes;
DROP POLICY IF EXISTS "usuario_versoes_via_doc"     ON versoes;

CREATE POLICY "admin_qualidade_versoes_all" ON versoes
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_versoes_via_doc" ON versoes
  FOR SELECT USING (
    documento_id IN (
      SELECT id FROM documentos WHERE area_id IN (
        SELECT a.id FROM areas a WHERE a.unidade_id IN (
          SELECT unidade_id FROM usuario_unidades WHERE usuario_id = auth.uid()
        )
      )
    )
  );

-- ── indicadores ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_indicadores_all" ON indicadores;
DROP POLICY IF EXISTS "usuario_indicadores_view"        ON indicadores;

CREATE POLICY "admin_qualidade_indicadores_all" ON indicadores
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_indicadores_view" ON indicadores
  FOR SELECT USING (
    area_id IN (
      SELECT a.id FROM areas a WHERE a.unidade_id IN (
        SELECT unidade_id FROM usuario_unidades WHERE usuario_id = auth.uid()
      )
    )
  );

-- ── resultados_indicadores ───────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_resultados_all" ON resultados_indicadores;
DROP POLICY IF EXISTS "usuario_resultados_view"        ON resultados_indicadores;

CREATE POLICY "admin_qualidade_resultados_all" ON resultados_indicadores
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_resultados_view" ON resultados_indicadores
  FOR SELECT USING (
    indicador_id IN (
      SELECT id FROM indicadores WHERE area_id IN (
        SELECT a.id FROM areas a WHERE a.unidade_id IN (
          SELECT unidade_id FROM usuario_unidades WHERE usuario_id = auth.uid()
        )
      )
    )
  );

-- ── treinamentos ─────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_treinamentos_all" ON treinamentos;
DROP POLICY IF EXISTS "usuario_treinamentos_view"        ON treinamentos;

CREATE POLICY "admin_qualidade_treinamentos_all" ON treinamentos
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_treinamentos_view" ON treinamentos
  FOR SELECT USING (
    area_id IN (
      SELECT a.id FROM areas a WHERE a.unidade_id IN (
        SELECT unidade_id FROM usuario_unidades WHERE usuario_id = auth.uid()
      )
    )
  );

-- ── treinamento_participantes ────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_participantes_all" ON treinamento_participantes;
DROP POLICY IF EXISTS "usuario_participantes_view"        ON treinamento_participantes;

CREATE POLICY "admin_qualidade_participantes_all" ON treinamento_participantes
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_participantes_view" ON treinamento_participantes
  FOR SELECT USING (usuario_id = auth.uid() OR is_admin_or_qualidade());

-- ── registros ────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_registros_all" ON registros;
DROP POLICY IF EXISTS "usuario_registros_view"        ON registros;

CREATE POLICY "admin_qualidade_registros_all" ON registros
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_registros_view" ON registros
  FOR SELECT USING (
    area_id IN (
      SELECT a.id FROM areas a WHERE a.unidade_id IN (
        SELECT unidade_id FROM usuario_unidades WHERE usuario_id = auth.uid()
      )
    )
  );

-- ── reunioes ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_reunioes_all" ON reunioes;
DROP POLICY IF EXISTS "usuario_reunioes_view"        ON reunioes;

CREATE POLICY "admin_qualidade_reunioes_all" ON reunioes
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_reunioes_view" ON reunioes
  FOR SELECT USING (created_by = auth.uid() OR is_admin_or_qualidade());

-- ── checklist_items ──────────────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_checklist_all" ON checklist_items;
DROP POLICY IF EXISTS "usuario_checklist_view"        ON checklist_items;

CREATE POLICY "admin_qualidade_checklist_all" ON checklist_items
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_checklist_view" ON checklist_items
  FOR SELECT USING (
    reuniao_id IN (
      SELECT id FROM reunioes WHERE created_by = auth.uid()
    )
  );

-- ── reuniao_acoes ────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_reuniao_acoes_all" ON reuniao_acoes;
DROP POLICY IF EXISTS "usuario_reuniao_acoes_view"        ON reuniao_acoes;

CREATE POLICY "admin_qualidade_reuniao_acoes_all" ON reuniao_acoes
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_reuniao_acoes_view" ON reuniao_acoes
  FOR SELECT USING (responsavel_id = auth.uid() OR is_admin_or_qualidade());

-- ── importacoes ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_importacoes_all" ON importacoes;
DROP POLICY IF EXISTS "usuario_importacoes_view"        ON importacoes;

CREATE POLICY "admin_qualidade_importacoes_all" ON importacoes
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_importacoes_view" ON importacoes
  FOR SELECT USING (importado_por = auth.uid());

-- ── audit_log ────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_audit_all" ON audit_log;
DROP POLICY IF EXISTS "usuario_audit_view"        ON audit_log;

CREATE POLICY "admin_qualidade_audit_all" ON audit_log
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_audit_view" ON audit_log
  FOR SELECT USING (usuario_id = auth.uid());

-- ── politicas_retencao ───────────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_politicas_all" ON politicas_retencao;
DROP POLICY IF EXISTS "todos_politicas_view"          ON politicas_retencao;

CREATE POLICY "admin_qualidade_politicas_all" ON politicas_retencao
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "todos_politicas_view" ON politicas_retencao
  FOR SELECT USING (true);

-- Garantir RLS habilitado em todas as tabelas (idempotente)
ALTER TABLE acoes                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE versoes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores              ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_indicadores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinamentos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinamento_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros                ENABLE ROW LEVEL SECURITY;
ALTER TABLE reunioes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reuniao_acoes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE importacoes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                ENABLE ROW LEVEL SECURITY;
ALTER TABLE politicas_retencao       ENABLE ROW LEVEL SECURITY;
