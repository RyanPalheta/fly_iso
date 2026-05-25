-- =============================================================================
-- SEED: Auditorias Demo
-- Cria auditorias de exemplo usando os 2 checklists padrão criados pela
-- migration 011_auditorias.sql.
--
-- Pré-requisitos:
--   1. Rodar migration 011_auditorias.sql (cria os checklists ISO9001_CL7 e CHK_5S)
--   2. Opcional: ter rodado o seed de treinamentos (cria as áreas)
--
-- Idempotente: DELETE primeiro pelos códigos demo conhecidos.
-- =============================================================================

-- Garante áreas (caso não tenha rodado outro seed antes)
INSERT INTO unidades (id, nome, codigo, ativa) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Unidade São Paulo', 'SP01', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO areas (id, nome, unidade_id) VALUES
  ('a2000000-0000-0000-0000-000000000001', 'Produção',         'a1000000-0000-0000-0000-000000000001'),
  ('a2000000-0000-0000-0000-000000000002', 'Qualidade',        'a1000000-0000-0000-0000-000000000001'),
  ('a2000000-0000-0000-0000-000000000003', 'Manutenção',       'a1000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ─── Limpa demo anterior ──────────────────────────────────────────────────────
DELETE FROM auditorias WHERE codigo IN ('AUD-2026-001', 'AUD-2026-002', 'AUD-2026-003');
-- as respostas e NCs vinculadas via FK ON DELETE CASCADE serão removidas junto

-- ─── INSERTs ──────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_chk_iso     uuid;
  v_chk_5s      uuid;
  v_aud_1       uuid;
  v_aud_2       uuid;
  v_aud_3       uuid;
  v_qualidade   uuid := 'a2000000-0000-0000-0000-000000000002';
  v_producao    uuid := 'a2000000-0000-0000-0000-000000000001';
  v_unidade_sp  uuid := 'a1000000-0000-0000-0000-000000000001';
BEGIN
  -- Carrega IDs dos checklists padrão
  SELECT id INTO v_chk_iso FROM auditoria_checklists WHERE codigo = 'ISO9001_CL7';
  SELECT id INTO v_chk_5s  FROM auditoria_checklists WHERE codigo = 'CHK_5S';

  IF v_chk_iso IS NULL OR v_chk_5s IS NULL THEN
    RAISE EXCEPTION 'Checklists padrão não encontrados. Rode 011_auditorias.sql primeiro.';
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- AUDITORIA 1 — PLANEJADA (futura, sem respostas)
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO auditorias (
    codigo, titulo, tipo, escopo, criterios,
    data_planejada, area_id, unidade_id, checklist_ids,
    status, pontuacao_total, pontuacao_max
  ) VALUES (
    'AUD-2026-001',
    'Auditoria Interna ISO 9001 — Q3/2026',
    'interna',
    'Áreas auditadas: Produção e Qualidade. Cláusulas 7 e 8 da ISO 9001:2015.',
    'ISO 9001:2015 + Procedimentos PCQ-001, PCQ-002 + Política da Qualidade vigente',
    '2026-08-15',
    v_qualidade,
    v_unidade_sp,
    jsonb_build_array(v_chk_iso::text),
    'planejada',
    0, 0
  ) RETURNING id INTO v_aud_1;

  -- ════════════════════════════════════════════════════════════════════════
  -- AUDITORIA 2 — EM EXECUÇÃO (com respostas parciais)
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO auditorias (
    codigo, titulo, tipo, escopo, criterios,
    data_planejada, data_realizada, area_id, unidade_id, checklist_ids,
    status, pontuacao_total, pontuacao_max
  ) VALUES (
    'AUD-2026-002',
    'Auditoria 5S — Linha de Produção A',
    '5s',
    'Posto de trabalho: linha A — todas as estações de trabalho',
    'Procedimento de 5S corporativo + cartões padrão',
    '2026-05-20', '2026-05-22', v_producao, v_unidade_sp,
    jsonb_build_array(v_chk_5s::text),
    'em_execucao',
    44, 80    -- 3 respondidas: 4+4+3 = 11 × peso 4 = 44; restantes não respondidas
  ) RETURNING id INTO v_aud_2;

  -- Respostas parciais para a auditoria 5S (3 de 5 respondidas)
  INSERT INTO auditoria_respostas (
    auditoria_id, checklist_id, pergunta_id, pergunta_snapshot,
    resposta_valor, pontos, observacao, respondido_em
  )
  SELECT
    v_aud_2, v_chk_5s, p->>'id',
    p,
    CASE p->>'id'
      WHEN 'seiri'    THEN 'otimo'
      WHEN 'seiton'   THEN 'otimo'
      WHEN 'seiso'    THEN 'bom'
    END,
    CASE p->>'id'
      WHEN 'seiri'    THEN 16  -- 4 × peso 4
      WHEN 'seiton'   THEN 16
      WHEN 'seiso'    THEN 12  -- 3 × peso 4
    END,
    CASE p->>'id'
      WHEN 'seiri'    THEN 'Área 100% livre de itens desnecessários. Etiquetas vermelhas zeradas no último ciclo.'
      WHEN 'seiton'   THEN 'Layout marcado, ferramentas com sombras pintadas no painel.'
      WHEN 'seiso'    THEN 'Limpeza diária realizada. Algumas manchas de óleo na máquina #3 — operador notificado.'
    END,
    now()
  FROM auditoria_checklists, jsonb_array_elements(perguntas) AS p
  WHERE id = v_chk_5s
    AND p->>'id' IN ('seiri', 'seiton', 'seiso');

  -- ════════════════════════════════════════════════════════════════════════
  -- AUDITORIA 3 — CONCLUÍDA (todas as 5 perguntas ISO 9001 respondidas)
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO auditorias (
    codigo, titulo, tipo, escopo, criterios,
    data_planejada, data_realizada, area_id, unidade_id, checklist_ids,
    status, resultado_resumo, pontuacao_total, pontuacao_max, concluida_em
  ) VALUES (
    'AUD-2026-003',
    'Auditoria Interna ISO 9001 — Cláusula 7 (Apoio) — Q1/2026',
    'interna',
    'Todas as áreas operacionais. Foco em informação documentada, competência e calibração.',
    'ISO 9001:2015 §7.1 até §7.5',
    '2026-02-10', '2026-02-12', v_qualidade, v_unidade_sp,
    jsonb_build_array(v_chk_iso::text),
    'concluida',
    E'Auditoria concluída com 2 NCs (1 menor + 1 maior) e 1 observação.\n\nPontos fortes:\n- Sistema de competências bem estruturado\n- Treinamentos com registro de eficácia\n\nPontos a melhorar:\n- Calibração de equipamentos com atrasos\n- Identificação de documentos não padronizada em algumas áreas',
    62,  -- Soma calculada abaixo
    115, -- Máximo possível (todas conformes)
    '2026-02-13 18:00:00-03'
  ) RETURNING id INTO v_aud_3;

  -- Respostas da auditoria 3 (todas as 5 perguntas)
  -- 7.1.5_a (peso 5): NC MAIOR → 0 pts (calibração atrasada)
  -- 7.2_a   (peso 5): CONFORME → 25 pts (5 × 5)
  -- 7.2_b   (peso 5): CONFORME → 25 pts
  -- 7.5.2   (peso 3): NC MENOR → 3 pts (1 × 3) — alguns docs sem padronização
  -- 7.5.3   (peso 5): OBSERVAÇÃO → 20 pts (4 × 5)
  -- TOTAL: 0 + 25 + 25 + 3 + 20 = 73 pts (recalculo abaixo deixará isso)
  -- MAX: 5×5 + 5×5 + 5×5 + 3×3 + 5×5 = 25+25+25+9+25 = 109

  INSERT INTO auditoria_respostas (
    auditoria_id, checklist_id, pergunta_id, pergunta_snapshot,
    resposta_valor, pontos, observacao, respondido_em
  )
  SELECT
    v_aud_3, v_chk_iso, p->>'id',
    p,
    CASE p->>'id'
      WHEN '7.1.5_a' THEN 'nc_maior'
      WHEN '7.2_a'   THEN 'conforme'
      WHEN '7.2_b'   THEN 'conforme'
      WHEN '7.5.2'   THEN 'nc_menor'
      WHEN '7.5.3'   THEN 'observacao'
    END,
    CASE p->>'id'
      WHEN '7.1.5_a' THEN 0
      WHEN '7.2_a'   THEN 25
      WHEN '7.2_b'   THEN 25
      WHEN '7.5.2'   THEN 3
      WHEN '7.5.3'   THEN 20
    END,
    CASE p->>'id'
      WHEN '7.1.5_a' THEN 'Identificados 3 equipamentos críticos com calibração vencida há mais de 60 dias (paquímetro PQ-002, micrômetro MC-008, balança BL-001). Procedimento de calibração não está sendo seguido conforme cronograma estabelecido.'
      WHEN '7.2_a'   THEN 'Matriz de competências completa e atualizada em todas as funções auditadas. Descrições claras de habilidades necessárias por cargo.'
      WHEN '7.2_b'   THEN 'Treinamentos registrados no sistema com avaliação de eficácia sistemática. 12 treinamentos no semestre, 10 com eficácia comprovada.'
      WHEN '7.5.2'   THEN 'Alguns documentos da área de Manutenção (5 instruções de trabalho) não contém data de revisão visível no cabeçalho. Falta padronização do template oficial.'
      WHEN '7.5.3'   THEN 'Controle de acesso adequado. Sugere-se implementar processo formal de descarte ao final do prazo de retenção — hoje não há procedimento documentado.'
    END,
    '2026-02-12 15:30:00-03'::timestamptz
  FROM auditoria_checklists, jsonb_array_elements(perguntas) AS p
  WHERE id = v_chk_iso;

  -- Recalcula pontuação real da auditoria 3 com base nas respostas
  UPDATE auditorias SET
    pontuacao_total = (
      SELECT COALESCE(SUM(pontos), 0)::int
      FROM auditoria_respostas
      WHERE auditoria_id = v_aud_3 AND pontos IS NOT NULL
    ),
    pontuacao_max = (
      SELECT COALESCE(SUM(
        (SELECT (peso_opt.value->>'pontos')::int * (p->>'peso')::int
         FROM jsonb_array_elements(p->'opcoes') peso_opt
         WHERE (peso_opt.value->>'pontos') IS NOT NULL
         ORDER BY (peso_opt.value->>'pontos')::int DESC
         LIMIT 1)
      ), 0)::int
      FROM auditoria_checklists, jsonb_array_elements(perguntas) AS p
      WHERE id = v_chk_iso
    )
  WHERE id = v_aud_3;
END $$;

-- ─── Resumo ────────────────────────────────────────────────────────────────────
SELECT
  a.codigo,
  a.titulo,
  a.tipo,
  a.status,
  a.pontuacao_total || '/' || a.pontuacao_max ||
    CASE WHEN a.pontuacao_max > 0
      THEN ' (' || ROUND((a.pontuacao_total::numeric / a.pontuacao_max) * 100)::int || '%)'
      ELSE ''
    END AS score,
  (SELECT count(*)::int FROM auditoria_respostas WHERE auditoria_id = a.id) AS respondidas,
  (SELECT count(*)::int FROM auditoria_respostas WHERE auditoria_id = a.id AND nc_id IS NOT NULL) AS ncs
FROM auditorias a
WHERE a.codigo LIKE 'AUD-2026-%'
ORDER BY a.codigo;
