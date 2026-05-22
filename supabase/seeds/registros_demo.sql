-- =============================================================================
-- SEED: Registros Demo (Fase D)
-- Cria registros de exemplo usando os 3 tipos padrão criados pela migration 010.
-- Pré-requisito: rodar 010_registros_configuraveis.sql ANTES deste seed.
--
-- O seed é idempotente: DELETA primeiro os registros com os códigos demo
-- (se existirem) e depois INSERE de novo. Pode rodar várias vezes.
-- =============================================================================

-- Garante áreas (reusa do seed de treinamentos se já rodou)
INSERT INTO unidades (id, nome, codigo, ativa) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Unidade São Paulo', 'SP01', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO areas (id, nome, unidade_id) VALUES
  ('a2000000-0000-0000-0000-000000000001', 'Produção',  'a1000000-0000-0000-0000-000000000001'),
  ('a2000000-0000-0000-0000-000000000002', 'Qualidade', 'a1000000-0000-0000-0000-000000000001'),
  ('a2000000-0000-0000-0000-000000000003', 'Manutenção','a1000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Limpa registros demo anteriores para tornar o seed idempotente
-- =============================================================================
DELETE FROM registros WHERE codigo IN (
  'INSP_RECEB-2026-0001', 'INSP_RECEB-2026-0002', 'INSP_RECEB-2026-0003',
  'INSP_RECEB-2026-0004', 'INSP_RECEB-2019-0042',
  'CALIB-2026-0001', 'CALIB-2026-0002', 'CALIB-2026-0003',
  'REUNIAO-2026-0001', 'REUNIAO-2026-0002', 'REUNIAO-2026-0003'
);

-- =============================================================================
-- INSERTs
-- =============================================================================
DO $$
DECLARE
  v_insp_id    uuid;
  v_calib_id   uuid;
  v_reuniao_id uuid;
  v_qualidade  uuid := 'a2000000-0000-0000-0000-000000000002';
  v_producao   uuid := 'a2000000-0000-0000-0000-000000000001';
  v_manut      uuid := 'a2000000-0000-0000-0000-000000000003';
BEGIN
  SELECT id INTO v_insp_id    FROM registro_tipos WHERE codigo = 'INSP_RECEB';
  SELECT id INTO v_calib_id   FROM registro_tipos WHERE codigo = 'CALIB';
  SELECT id INTO v_reuniao_id FROM registro_tipos WHERE codigo = 'REUNIAO';

  IF v_insp_id IS NULL OR v_calib_id IS NULL OR v_reuniao_id IS NULL THEN
    RAISE EXCEPTION 'Tipos padrão não encontrados. Rode 010_registros_configuraveis.sql primeiro.';
  END IF;

  -- ─── 1. Inspeções de Recebimento (5) ──────────────────────────────────────
  INSERT INTO registros (
    tipo_id, codigo, titulo, dados, area_id,
    data_criacao, prazo_descarte, status
  ) VALUES
    (
      v_insp_id, 'INSP_RECEB-2026-0001',
      'Recebimento Aço SAE 1020 — Lote 2026-04-12',
      jsonb_build_object(
        'fornecedor',  'Siderúrgica Nacional Ltda.',
        'nota_fiscal', 'NF-12348',
        'lote',        'L-2026-04-12-001',
        'quantidade',  500,
        'conforme',    true,
        'observacoes', 'Material dentro das especificações. Certificado de qualidade conferido.',
        'anexos',      jsonb_build_array()
      ),
      v_qualidade,
      '2026-04-12', '2031-04-12', 'ativo'
    ),
    (
      v_insp_id, 'INSP_RECEB-2026-0002',
      'Recebimento Parafusos M8 — Lote LP-2026-0042',
      jsonb_build_object(
        'fornecedor',  'Fixadores Industriais SA',
        'nota_fiscal', 'NF-89923',
        'lote',        'LP-2026-0042',
        'quantidade',  10000,
        'conforme',    true,
        'observacoes', 'Amostragem AQL 0.65 aprovada.',
        'anexos',      jsonb_build_array()
      ),
      v_qualidade,
      '2026-04-15', '2031-04-15', 'ativo'
    ),
    (
      v_insp_id, 'INSP_RECEB-2026-0003',
      'Recebimento Tinta Epóxi — Lote TE-998',
      jsonb_build_object(
        'fornecedor',  'Tintas Indústria Sul',
        'nota_fiscal', 'NF-77451',
        'lote',        'TE-998',
        'quantidade',  120,
        'conforme',    false,
        'observacoes', 'Material não conforme — viscosidade fora da faixa especificada. NC-2026-018 aberta. Lote devolvido ao fornecedor.',
        'anexos',      jsonb_build_array()
      ),
      v_qualidade,
      '2026-04-20', '2031-04-20', 'ativo'
    ),
    (
      v_insp_id, 'INSP_RECEB-2026-0004',
      'Recebimento Embalagens Caixa 30x20x15',
      jsonb_build_object(
        'fornecedor',  'Embalagens Premium',
        'nota_fiscal', 'NF-44102',
        'lote',        'EMB-2026-15',
        'quantidade',  2000,
        'conforme',    true,
        'observacoes', '',
        'anexos',      jsonb_build_array()
      ),
      v_producao,
      '2026-05-02', '2031-05-02', 'ativo'
    ),
    (
      -- Prazo vencido (de 2019) - para testar o banner de vencidos
      v_insp_id, 'INSP_RECEB-2019-0042',
      'Recebimento histórico — exemplo de prazo vencido',
      jsonb_build_object(
        'fornecedor',  'Fornecedor Antigo Ltda.',
        'nota_fiscal', 'NF-00012',
        'lote',        'L-OLD-2019',
        'quantidade',  50,
        'conforme',    true,
        'observacoes', 'Registro de 2019 — prazo de retenção (5 anos) vencido em 2024.',
        'anexos',      jsonb_build_array()
      ),
      v_qualidade,
      '2019-06-10', '2024-06-10', 'ativo'
    );

  -- ─── 2. Calibrações (3) ────────────────────────────────────────────────────
  INSERT INTO registros (
    tipo_id, codigo, titulo, dados, area_id,
    data_criacao, prazo_descarte, status
  ) VALUES
    (
      v_calib_id, 'CALIB-2026-0001',
      'Calibração Paquímetro Digital 150mm — TAG PQ-001',
      jsonb_build_object(
        'instrumento',        'Paquímetro Digital Mitutoyo 500-196-30B',
        'identificacao',      'PQ-001',
        'data_calibracao',    '2026-03-08',
        'proxima_calibracao', '2027-03-08',
        'laboratorio',        'Lab. Metroquality (RBC nº 0245)',
        'resultado',          'Aprovado',
        'certificado',        jsonb_build_array()
      ),
      v_qualidade,
      '2026-03-08', '2036-03-08', 'ativo'
    ),
    (
      v_calib_id, 'CALIB-2026-0002',
      'Calibração Micrômetro 0-25mm — TAG MC-007',
      jsonb_build_object(
        'instrumento',        'Micrômetro Externo Digimess 0-25mm',
        'identificacao',      'MC-007',
        'data_calibracao',    '2026-03-08',
        'proxima_calibracao', '2027-03-08',
        'laboratorio',        'Lab. Metroquality (RBC nº 0245)',
        'resultado',          'Aprovado com restrição',
        'certificado',        jsonb_build_array()
      ),
      v_qualidade,
      '2026-03-08', '2036-03-08', 'ativo'
    ),
    (
      v_calib_id, 'CALIB-2026-0003',
      'Calibração Balança 30kg — TAG BL-003',
      jsonb_build_object(
        'instrumento',        'Balança Eletrônica Toledo 9094',
        'identificacao',      'BL-003',
        'data_calibracao',    '2026-04-22',
        'proxima_calibracao', '2027-04-22',
        'laboratorio',        'IPEM-SP',
        'resultado',          'Aprovado',
        'certificado',        jsonb_build_array()
      ),
      v_producao,
      '2026-04-22', '2036-04-22', 'ativo'
    );

  -- ─── 3. Atas de Reunião (3) ────────────────────────────────────────────────
  INSERT INTO registros (
    tipo_id, codigo, titulo, dados, area_id,
    data_criacao, prazo_descarte, status
  ) VALUES
    (
      v_reuniao_id, 'REUNIAO-2026-0001',
      'Reunião Mensal de Qualidade — Abril/2026',
      jsonb_build_object(
        'assunto',        'Reunião Mensal de Qualidade',
        'data_reuniao',   '2026-04-30',
        'local',          'Sala de Reuniões A — Unidade SP01',
        'participantes',  E'Ana Beatriz Souza (Qualidade)\nCarlos Henrique Lima (Produção)\nFernanda Costa (Qualidade)\nMarcos Rocha (Manutenção)',
        'pauta',          E'1) Análise de NCs do mês\n2) Status do CAPA-2026-005\n3) Indicadores Q1/2026\n4) Próximas auditorias internas',
        'decisoes',       E'- Reforçar treinamento de PCQ na linha 2 até 15/maio\n- Reabrir CAPA-2026-002 (eficácia não comprovada)\n- Auditoria interna agendada para 18-22/maio',
        'anexos',         jsonb_build_array()
      ),
      v_qualidade,
      '2026-04-30', '2031-04-30', 'ativo'
    ),
    (
      v_reuniao_id, 'REUNIAO-2026-0002',
      'Análise Crítica pela Direção — H1/2026',
      jsonb_build_object(
        'assunto',        'Análise Crítica pela Direção',
        'data_reuniao',   '2026-05-15',
        'local',          'Sala de Direção',
        'participantes',  E'Diretoria executiva\nGerência da Qualidade\nGerências operacionais',
        'pauta',          E'1) Resultados do SGQ no semestre\n2) Reclamações de clientes\n3) Desempenho de indicadores estratégicos\n4) Recursos para o próximo semestre',
        'decisoes',       E'- Aprovação do orçamento adicional para metrologia (+R$ 45k)\n- Meta de NC do semestre revisada de 20 para 15\n- Contratação de 1 auditor interno até julho',
        'anexos',         jsonb_build_array()
      ),
      v_qualidade,
      '2026-05-15', '2031-05-15', 'ativo'
    ),
    (
      v_reuniao_id, 'REUNIAO-2026-0003',
      'Reunião de Manutenção Preventiva — Maio/2026',
      jsonb_build_object(
        'assunto',        'Planejamento da Manutenção Preventiva',
        'data_reuniao',   '2026-05-05',
        'local',          'Sala de Manutenção',
        'participantes',  E'Marcos Rocha (líder de manutenção)\nEquipe de manutenção (5 pessoas)',
        'pauta',          E'1) Cronograma de paradas programadas\n2) Estoque de peças críticas\n3) Equipamentos com manutenção atrasada',
        'decisoes',       E'- Parada programada da linha CNC para 25/maio\n- Solicitar reposição de rolamentos críticos\n- Acompanhar atraso no torno CNC #3',
        'anexos',         jsonb_build_array()
      ),
      v_manut,
      '2026-05-05', '2031-05-05', 'ativo'
    );
END $$;

-- ─── Resumo ────────────────────────────────────────────────────────────────────
SELECT
  rt.nome           AS tipo,
  count(r.id)::int  AS qtd,
  count(*) FILTER (WHERE r.status = 'ativo')::int       AS ativos,
  count(*) FILTER (WHERE r.prazo_descarte < CURRENT_DATE AND r.arquivado_em IS NULL AND r.status = 'ativo')::int AS vencidos
FROM registro_tipos rt
LEFT JOIN registros r ON r.tipo_id = rt.id
GROUP BY rt.nome
ORDER BY rt.nome;
