/**
 * Adiciona as policies RLS que estavam faltando no schema inicial.
 * Tabelas com RLS ativo mas sem policy: acoes, versoes, treinamentos,
 * indicadores, registros, reunioes.
 *
 * Executa via service_role (bypass RLS) para poder criar as policies.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env = readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim()
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
if (!url || !key) { console.error('Missing env vars'); process.exit(1) }

const sb = createClient(url, key, { auth: { persistSession: false } })

// Executa SQL raw via rpc (service_role pode usar pg_query se disponível)
// Supabase expõe isso via /rest/v1/rpc/exec_sql — mas melhor usar a API de admin
// Para executar SQL diretamente usamos fetch na Management API
const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!projectRef) { console.error('Não consegui extrair project ref da URL'); process.exit(1) }

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!SUPABASE_ACCESS_TOKEN) {
  console.log('\n⚠️  SUPABASE_ACCESS_TOKEN não definido.')
  console.log('   Crie um Personal Access Token em https://supabase.com/dashboard/account/tokens')
  console.log('   e rode: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/fix-rls.mjs\n')
  console.log('   Alternativa: cole o SQL abaixo no SQL Editor do Supabase Dashboard:\n')
  console.log(SQL)
  process.exit(0)
}

const SQL = `
-- ============================================================
-- Fly ISO — RLS policies faltantes (002_fix_rls_policies.sql)
-- ============================================================

-- Helper reutilizável (já existe, apenas garante)
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
DROP POLICY IF EXISTS "admin_qualidade_acoes_all" ON acoes;
DROP POLICY IF EXISTS "usuario_acoes_via_capa"    ON acoes;

CREATE POLICY "admin_qualidade_acoes_all" ON acoes
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_acoes_via_capa" ON acoes
  FOR SELECT USING (
    capa_id IN (
      SELECT id FROM capas WHERE
        nc_id IN (
          SELECT id FROM nao_conformidades WHERE
            area_id IN (
              SELECT a.id FROM areas a
              WHERE a.unidade_id IN (
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
      SELECT id FROM documentos WHERE
        area_id IN (
          SELECT a.id FROM areas a
          WHERE a.unidade_id IN (
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
      SELECT a.id FROM areas a
      WHERE a.unidade_id IN (
        SELECT unidade_id FROM usuario_unidades WHERE usuario_id = auth.uid()
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
      SELECT a.id FROM areas a
      WHERE a.unidade_id IN (
        SELECT unidade_id FROM usuario_unidades WHERE usuario_id = auth.uid()
      )
    )
  );

-- ── registros ────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_qualidade_registros_all" ON registros;
DROP POLICY IF EXISTS "usuario_registros_view"        ON registros;

CREATE POLICY "admin_qualidade_registros_all" ON registros
  FOR ALL USING (is_admin_or_qualidade());

CREATE POLICY "usuario_registros_view" ON registros
  FOR SELECT USING (
    area_id IN (
      SELECT a.id FROM areas a
      WHERE a.unidade_id IN (
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
  FOR SELECT USING (
    created_by = auth.uid() OR is_admin_or_qualidade()
  );
`

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  }
)

if (!res.ok) {
  const body = await res.text()
  console.error('❌ Erro na Management API:', res.status, body)
  console.log('\nCole o SQL abaixo no SQL Editor do Supabase:\n')
  console.log(SQL)
  process.exit(1)
}

console.log('✅ Policies RLS aplicadas com sucesso!')
console.log('   Tabelas corrigidas: acoes, versoes, indicadores, treinamentos, registros, reunioes')
