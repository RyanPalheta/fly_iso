-- =============================================================
-- Migration 005 — Storage Buckets para uploads
-- =============================================================
-- Cria buckets para evidências de NCs, certificados de treinamento,
-- arquivos de documentos e evidências de CAPA.
-- =============================================================

-- ── 1. Bucket: evidências de NCs e CAPAs ──────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', true)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Bucket: documentos (arquivos das versões) ──────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Bucket: certificados de treinamento ────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados', 'certificados', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- POLICIES — Authenticated users podem ler e escrever
-- =============================================================

-- Ler: qualquer autenticado pode visualizar arquivos públicos
DROP POLICY IF EXISTS "evidencias_read"   ON storage.objects;
DROP POLICY IF EXISTS "documentos_read"   ON storage.objects;
DROP POLICY IF EXISTS "certificados_read" ON storage.objects;

CREATE POLICY "evidencias_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidencias');

CREATE POLICY "documentos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'documentos');

CREATE POLICY "certificados_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'certificados');

-- Inserir: apenas usuários autenticados
DROP POLICY IF EXISTS "evidencias_insert"   ON storage.objects;
DROP POLICY IF EXISTS "documentos_insert"   ON storage.objects;
DROP POLICY IF EXISTS "certificados_insert" ON storage.objects;

CREATE POLICY "evidencias_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'evidencias' AND auth.role() = 'authenticated');

CREATE POLICY "documentos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');

CREATE POLICY "certificados_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'certificados' AND auth.role() = 'authenticated');

-- Atualizar / Deletar: apenas o dono do arquivo (owner) ou admin
DROP POLICY IF EXISTS "evidencias_update"   ON storage.objects;
DROP POLICY IF EXISTS "evidencias_delete"   ON storage.objects;
DROP POLICY IF EXISTS "documentos_update"   ON storage.objects;
DROP POLICY IF EXISTS "documentos_delete"   ON storage.objects;
DROP POLICY IF EXISTS "certificados_update" ON storage.objects;
DROP POLICY IF EXISTS "certificados_delete" ON storage.objects;

CREATE POLICY "evidencias_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'evidencias' AND auth.role() = 'authenticated');
CREATE POLICY "evidencias_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'evidencias' AND auth.role() = 'authenticated');

CREATE POLICY "documentos_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');
CREATE POLICY "documentos_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');

CREATE POLICY "certificados_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'certificados' AND auth.role() = 'authenticated');
CREATE POLICY "certificados_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'certificados' AND auth.role() = 'authenticated');
