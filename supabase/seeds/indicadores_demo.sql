-- ============================================================
-- Seed de Indicadores Demo — Fly ISO
-- ============================================================
-- Insere 4 indicadores realistas + resultados mensais (últimos 6 meses).
-- Idempotente: usa codigo único como conflict target.
-- ============================================================

-- Variáveis: pegamos a primeira área e o primeiro usuário disponíveis
DO $$
DECLARE
  v_area_id   UUID;
  v_user_id   UUID;
  v_ind_satisfacao    UUID;
  v_ind_defeitos      UUID;
  v_ind_treinamento   UUID;
  v_ind_otd           UUID;
BEGIN
  -- Primeira área (cria fallback se não houver)
  SELECT id INTO v_area_id FROM areas LIMIT 1;
  IF v_area_id IS NULL THEN
    RAISE NOTICE 'Nenhuma área encontrada — crie unidades/áreas em /configuracoes/organizacao primeiro.';
    RETURN;
  END IF;

  -- Primeiro usuário ativo
  SELECT id INTO v_user_id FROM usuarios WHERE ativo = true LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Nenhum usuário encontrado — faça login pelo menos uma vez.';
    RETURN;
  END IF;

  -- ── INDICADOR 1: Satisfação do Cliente (NPS) ──────────────────
  INSERT INTO indicadores (
    codigo, nome, descricao, formula, unidade_medida, meta,
    frequencia, area_id, responsavel_id, gerar_nc_abaixo_meta, ativo
  ) VALUES (
    'IND-DEMO-001',
    'Índice de Satisfação do Cliente (NPS)',
    'Net Promoter Score consolidado das pesquisas de pós-venda mensais.',
    '(% Promotores - % Detratores)',
    'pontos',
    70,
    'mensal',
    v_area_id,
    v_user_id,
    true,    -- gera NC se abaixo da meta
    true
  )
  ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_ind_satisfacao;

  -- Resultados últimos 6 meses (acima da meta na maior parte, com 1 queda)
  INSERT INTO resultados_indicadores (indicador_id, periodo, valor, observacoes, registrado_por) VALUES
    (v_ind_satisfacao, '2025-12', 72, 'Resultado dentro da meta. Crescimento gradual.', v_user_id),
    (v_ind_satisfacao, '2026-01', 75, 'Acima da meta — campanha de pós-venda foi efetiva.', v_user_id),
    (v_ind_satisfacao, '2026-02', 68, 'Queda de 7pp em relação ao mês anterior — investigar feedbacks negativos.', v_user_id),
    (v_ind_satisfacao, '2026-03', 71, 'Recuperação após ajustes no atendimento.', v_user_id),
    (v_ind_satisfacao, '2026-04', 73, 'Tendência de alta retomada.', v_user_id),
    (v_ind_satisfacao, '2026-05', 76, 'Melhor resultado dos últimos 6 meses.', v_user_id)
  ON CONFLICT DO NOTHING;

  -- ── INDICADOR 2: Taxa de Defeitos por Lote ──────────────
  INSERT INTO indicadores (
    codigo, nome, descricao, formula, unidade_medida, meta,
    frequencia, area_id, responsavel_id, gerar_nc_abaixo_meta, ativo
  ) VALUES (
    'IND-DEMO-002',
    'Conformidade de Lotes Produzidos',
    'Percentual de lotes aprovados na inspeção final (sem reprovação).',
    '(Lotes aprovados / Total) × 100',
    '%',
    98,
    'mensal',
    v_area_id,
    v_user_id,
    true,
    true
  )
  ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_ind_defeitos;

  INSERT INTO resultados_indicadores (indicador_id, periodo, valor, observacoes, registrado_por) VALUES
    (v_ind_defeitos, '2025-12', 99.2, 'Excelente — apenas 2 lotes reprovados em 250.', v_user_id),
    (v_ind_defeitos, '2026-01', 98.5, 'Dentro da meta.', v_user_id),
    (v_ind_defeitos, '2026-02', 96.8, 'ABAIXO DA META — problema em sensores ópticos. NC aberta.', v_user_id),
    (v_ind_defeitos, '2026-03', 97.4, 'Ainda abaixo. CAPA em execução.', v_user_id),
    (v_ind_defeitos, '2026-04', 98.7, 'Recuperação após manutenção dos sensores.', v_user_id),
    (v_ind_defeitos, '2026-05', 99.1, 'Tendência consistente acima da meta.', v_user_id)
  ON CONFLICT DO NOTHING;

  -- ── INDICADOR 3: Treinamento Interno ──────────────
  INSERT INTO indicadores (
    codigo, nome, descricao, formula, unidade_medida, meta,
    frequencia, area_id, responsavel_id, gerar_nc_abaixo_meta, ativo
  ) VALUES (
    'IND-DEMO-003',
    'Cobertura de Treinamento Obrigatório',
    '% de colaboradores que concluíram os treinamentos obrigatórios atribuídos.',
    '(Concluídos / Total atribuídos) × 100',
    '%',
    90,
    'mensal',
    v_area_id,
    v_user_id,
    false,   -- aviso interno, não gera NC automática
    true
  )
  ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_ind_treinamento;

  INSERT INTO resultados_indicadores (indicador_id, periodo, valor, observacoes, registrado_por) VALUES
    (v_ind_treinamento, '2025-12', 88, 'Próximo da meta. Faltam 4 colaboradores no curso de EHS.', v_user_id),
    (v_ind_treinamento, '2026-01', 92, 'Meta atingida.', v_user_id),
    (v_ind_treinamento, '2026-02', 91, 'Estável.', v_user_id),
    (v_ind_treinamento, '2026-03', 87, 'Queda devido a novos contratados pendentes de onboarding.', v_user_id),
    (v_ind_treinamento, '2026-04', 93, 'Onboarding concluído — recuperação completa.', v_user_id),
    (v_ind_treinamento, '2026-05', 95, 'Melhor mês — ciclo de reciclagem antecipado.', v_user_id)
  ON CONFLICT DO NOTHING;

  -- ── INDICADOR 4: Entrega no Prazo (On-Time Delivery) ──────────────
  INSERT INTO indicadores (
    codigo, nome, descricao, formula, unidade_medida, meta,
    frequencia, area_id, responsavel_id, gerar_nc_abaixo_meta, ativo
  ) VALUES (
    'IND-DEMO-004',
    'Pedidos Entregues no Prazo (OTD)',
    'Percentual de pedidos despachados na data prometida ao cliente.',
    '(Pedidos no prazo / Total) × 100',
    '%',
    95,
    'mensal',
    v_area_id,
    v_user_id,
    true,
    true
  )
  ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_ind_otd;

  INSERT INTO resultados_indicadores (indicador_id, periodo, valor, observacoes, registrado_por) VALUES
    (v_ind_otd, '2025-12', 96.5, 'Período de baixa demanda — fácil cumprir prazo.', v_user_id),
    (v_ind_otd, '2026-01', 93.8, 'Ligeiramente abaixo — atrasos na logística regional.', v_user_id),
    (v_ind_otd, '2026-02', 89.2, 'CRÍTICO — gargalo na expedição. NC aberta.', v_user_id),
    (v_ind_otd, '2026-03', 91.5, 'Em recuperação após contratação de 2 operadores.', v_user_id),
    (v_ind_otd, '2026-04', 96.1, 'Meta atingida.', v_user_id),
    (v_ind_otd, '2026-05', 97.3, 'Excelente — nova rota de transportadora consolidada.', v_user_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Seed concluído! 4 indicadores demo + 24 resultados criados.';
  RAISE NOTICE '   Use /indicadores para visualizar e /indicadores/IND-DEMO-XXX/lancar para testar NC automática.';

END $$;
