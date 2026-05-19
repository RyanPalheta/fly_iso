-- =============================================================
-- Migration 004 — Apontamentos do Auditor (Fase A)
-- =============================================================
-- Aplicar mudanças identificadas em reunião com auditor mestre:
--   1. Status 'vigente' em documentos
--   2. Status 'atrasada' em ações (calculado em runtime via prazo)
--   3. NC: campo tipo_acao (corretiva/preventiva) — obrigatório no registro
--   4. NC: campo acao_imediata (texto opcional) — ação sobre o efeito
--   5. versoes.descricao_alteracao agora exigido (constraint)
-- =============================================================

-- ── 1 & 2. Status são VARCHAR — apenas adicionamos CHECK constraints novas ──
-- (Os enums lógicos foram modelados como VARCHAR sem CHECK, então não há
-- migração necessária para aceitar 'vigente' / 'atrasada'. A enforcement
-- acontece em TypeScript.)

-- ── 3. NC: tipo_acao ──
ALTER TABLE nao_conformidades
  ADD COLUMN IF NOT EXISTS tipo_acao VARCHAR(20) DEFAULT 'corretiva';

-- Backfill: NCs originadas de auditoria são sempre corretivas (NC já ocorreu)
UPDATE nao_conformidades
   SET tipo_acao = 'corretiva'
 WHERE tipo_acao IS NULL
   AND origem IN ('auditoria_interna', 'auditoria_externa', 'cliente', 'processo');

-- NCs originadas de indicador podem ser preventivas (sinal antecipado)
-- Aqui mantemos 'corretiva' por padrão; usuário muda manualmente se for preventiva.

-- Não permitir NULL daqui em diante
ALTER TABLE nao_conformidades
  ALTER COLUMN tipo_acao SET NOT NULL;

-- ── 4. NC: ação imediata (opcional) ──
ALTER TABLE nao_conformidades
  ADD COLUMN IF NOT EXISTS acao_imediata TEXT;

COMMENT ON COLUMN nao_conformidades.acao_imediata IS
  'Ação imediata sobre o EFEITO do problema (contenção). Não é correção de causa raiz.';

COMMENT ON COLUMN nao_conformidades.tipo_acao IS
  'corretiva = NC já ocorreu (default); preventiva = NC passível de ocorrer.';

-- ── 5. versoes.descricao_alteracao agora exigida em novas linhas ──
-- (Mantém NULL nas linhas existentes para não quebrar histórico. Inserts
--  novos serão validados via Zod no client + check do servidor.)

-- =============================================================
-- ÍNDICES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_nc_tipo_acao ON nao_conformidades(tipo_acao);

-- =============================================================
-- DONE
-- =============================================================
