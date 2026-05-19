-- =============================================================
-- Migration 007 — Observação textual em ações do plano CAPA
-- =============================================================
-- Adiciona coluna observacao para comentários sobre o progresso /
-- contexto das evidências de cada ação. As evidências em si já são
-- armazenadas em evidencia_urls (JSONB) — apenas a anotação faltava.
-- =============================================================

ALTER TABLE acoes
  ADD COLUMN IF NOT EXISTS observacao TEXT;

COMMENT ON COLUMN acoes.observacao IS
  'Comentário livre sobre progresso, dificuldades ou contexto das evidências.';
