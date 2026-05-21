-- =============================================================================
-- SEED: Treinamentos Demo
-- Não cria usuários (FK para auth.users) — usa NULL nos campos de user_id
-- e nome_snapshot nos participantes. Execute no SQL Editor do Supabase.
-- =============================================================================

-- ─── 1. Unidades e Áreas ─────────────────────────────────────────────────────

INSERT INTO unidades (id, nome, codigo, ativa) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Unidade São Paulo', 'SP01', true),
  ('a1000000-0000-0000-0000-000000000002', 'Unidade Campinas',  'CP01', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO areas (id, nome, unidade_id) VALUES
  ('a2000000-0000-0000-0000-000000000001', 'Produção',         'a1000000-0000-0000-0000-000000000001'),
  ('a2000000-0000-0000-0000-000000000002', 'Qualidade',        'a1000000-0000-0000-0000-000000000001'),
  ('a2000000-0000-0000-0000-000000000003', 'Manutenção',       'a1000000-0000-0000-0000-000000000001'),
  ('a2000000-0000-0000-0000-000000000004', 'RH & Treinamento', 'a1000000-0000-0000-0000-000000000002'),
  ('a2000000-0000-0000-0000-000000000005', 'Logística',        'a1000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Documentos vigentes ───────────────────────────────────────────────────
-- responsavel_id = NULL (sem FK para auth.users)

INSERT INTO documentos (id, codigo, titulo, tipo, area_id, responsavel_id, status, revisao_atual) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'DOC-010', 'Procedimento de Controle de Qualidade no Processo',
    'Procedimento', 'a2000000-0000-0000-0000-000000000002', NULL, 'vigente', 2
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'DOC-011', 'Instrução de Operação de Máquina CNC',
    'Instrucao', 'a2000000-0000-0000-0000-000000000001', NULL, 'vigente', 1
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'DOC-012', 'Manual de Manutenção Preventiva',
    'Manual', 'a2000000-0000-0000-0000-000000000003', NULL, 'vigente', 0
  )
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Treinamentos INTERNOS ──────────────────────────────────────────────────

INSERT INTO treinamentos (
  id, categoria, titulo, descricao, instrutor, data_treinamento,
  validade_meses, area_id, tipo, documento_id, revisao_doc, status
) VALUES
  (
    'e0000000-0000-0000-0000-000000000001', 'interno',
    'Controle de Qualidade no Processo Produtivo',
    'Técnicas de amostragem, limites de aceitação e registros obrigatórios conforme DOC-010.',
    'Ana Beatriz Souza', '2026-03-15', 12,
    'a2000000-0000-0000-0000-000000000002', 'presencial',
    'd0000000-0000-0000-0000-000000000001', 2, 'realizado'
  ),
  (
    'e0000000-0000-0000-0000-000000000002', 'interno',
    'Operação de Máquina CNC — Instrução v1',
    'Treinamento prático na instrução de operação da linha CNC: segurança e parâmetros de corte.',
    'Carlos Henrique Lima', '2026-04-10', 24,
    'a2000000-0000-0000-0000-000000000001', 'presencial',
    'd0000000-0000-0000-0000-000000000002', 1, 'realizado'
  ),
  (
    'e0000000-0000-0000-0000-000000000003', 'interno',
    'Manutenção Preventiva — Leitura do Manual v0',
    'Leitura e interpretação do Manual de Manutenção Preventiva pela equipe de manutenção.',
    NULL, '2026-06-15', 12,
    'a2000000-0000-0000-0000-000000000003', 'leitura',
    'd0000000-0000-0000-0000-000000000003', 0, 'planejado'
  ),
  (
    'e0000000-0000-0000-0000-000000000004', 'interno',
    'ISO 9001 Conscientização — SGQ Básico',
    'Sensibilização sobre requisitos da ISO 9001:2015: política, objetivos e participação dos colaboradores.',
    'Ana Beatriz Souza', '2026-01-20', 12,
    NULL, 'presencial',
    'd0000000-0000-0000-0000-000000000001', 2, 'realizado'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── 4. Treinamentos EXTERNOS ─────────────────────────────────────────────────

INSERT INTO treinamentos (
  id, categoria, titulo, descricao, instrutor, data_treinamento,
  validade_meses, area_id, tipo, entidade_promotora, carga_horaria,
  mes_planejado, custo, status
) VALUES
  (
    'e0000000-0000-0000-0000-000000000005', 'externo',
    'Lead Auditor ISO 9001:2015 — Bureau Veritas',
    'Formação de Auditor Líder em SGQ. 5 dias com exame de certificação IRCA.',
    'Inst. Bureau Veritas', '2026-04-07', 36,
    'a2000000-0000-0000-0000-000000000002', 'presencial',
    'Bureau Veritas', 40, '2026-04', 4500.00, 'realizado'
  ),
  (
    'e0000000-0000-0000-0000-000000000006', 'externo',
    'NR-12 — Segurança em Máquinas e Equipamentos',
    'Treinamento obrigatório conforme NR-12. Prevenção de acidentes em máquinas industriais.',
    'Inst. SENAI', '2026-02-18', 24,
    'a2000000-0000-0000-0000-000000000001', 'presencial',
    'SENAI', 16, '2026-02', 800.00, 'realizado'
  ),
  (
    'e0000000-0000-0000-0000-000000000007', 'externo',
    'Excel Avançado para Análise de Dados de Qualidade',
    'Dashboards, tabelas dinâmicas e gráficos de controle estatístico de processo (CEP) em Excel.',
    'Inst. Online Cursos', NULL, 12,
    'a2000000-0000-0000-0000-000000000002', 'online',
    'Online Cursos Pro', 20, '2026-06', 290.00, 'planejado'
  ),
  (
    'e0000000-0000-0000-0000-000000000008', 'externo',
    'Gestão de Estoque e Logística — IMAM',
    'Técnicas modernas de gestão de estoque: FIFO/FEFO, indicadores de logística e WMS.',
    'Inst. IMAM', NULL, 24,
    'a2000000-0000-0000-0000-000000000005', 'presencial',
    'IMAM Consultoria', 24, '2026-07', 1200.00, 'planejado'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── 5. Participantes (todos com usuario_id = NULL — apenas nome_snapshot) ────

INSERT INTO treinamento_participantes (
  treinamento_id, usuario_id, nome_snapshot, matricula, setor, turno, status, aceite_digital
) VALUES
  -- e01: Controle de Qualidade (realizado)
  ('e0000000-0000-0000-0000-000000000001', NULL, 'Ana Beatriz Souza',    'M-001', 'Qualidade',  'manha',    'concluido', true),
  ('e0000000-0000-0000-0000-000000000001', NULL, 'Fernanda Costa',       'M-003', 'Qualidade',  'tarde',    'concluido', true),
  ('e0000000-0000-0000-0000-000000000001', NULL, 'Lucia Alves',          'M-005', 'Produção',   'manha',    'concluido', false),
  ('e0000000-0000-0000-0000-000000000001', NULL, 'Roberto Nascimento',   'M-010', 'Qualidade',  'manha',    'ausente',   false),

  -- e02: CNC (realizado)
  ('e0000000-0000-0000-0000-000000000002', NULL, 'Carlos Henrique Lima', 'M-002', 'Produção',   'tarde',    'concluido', true),
  ('e0000000-0000-0000-0000-000000000002', NULL, 'João Pedro Martins',   'M-004', 'Produção',   'tarde',    'concluido', true),
  ('e0000000-0000-0000-0000-000000000002', NULL, 'Marcos Rocha',         'M-006', 'Produção',   'noite',    'concluido', false),
  ('e0000000-0000-0000-0000-000000000002', NULL, 'Paulo César Dias',     'M-011', 'Produção',   'integral', 'pendente',  false),

  -- e03: Manutenção (planejado)
  ('e0000000-0000-0000-0000-000000000003', NULL, 'Marcos Rocha',         'M-006', 'Manutenção', 'noite',    'pendente',  false),
  ('e0000000-0000-0000-0000-000000000003', NULL, 'Sergio Lopes',         'M-012', 'Manutenção', 'tarde',    'pendente',  false),

  -- e04: ISO Conscientização (realizado)
  ('e0000000-0000-0000-0000-000000000004', NULL, 'Ana Beatriz Souza',    'M-001', 'Qualidade',  'manha',    'concluido', true),
  ('e0000000-0000-0000-0000-000000000004', NULL, 'Carlos Henrique Lima', 'M-002', 'Produção',   'tarde',    'concluido', true),
  ('e0000000-0000-0000-0000-000000000004', NULL, 'Fernanda Costa',       'M-003', 'Qualidade',  'tarde',    'concluido', true),
  ('e0000000-0000-0000-0000-000000000004', NULL, 'João Pedro Martins',   'M-004', 'Produção',   'tarde',    'concluido', false),
  ('e0000000-0000-0000-0000-000000000004', NULL, 'Lucia Alves',          'M-005', 'Produção',   'manha',    'concluido', false),
  ('e0000000-0000-0000-0000-000000000004', NULL, 'Marcos Rocha',         'M-006', 'Manutenção', 'noite',    'ausente',   false),

  -- e05: Lead Auditor (externo — realizado)
  ('e0000000-0000-0000-0000-000000000005', NULL, 'Ana Beatriz Souza',    'M-001', 'Qualidade',  'integral', 'concluido', true),
  ('e0000000-0000-0000-0000-000000000005', NULL, 'Fernanda Costa',       'M-003', 'Qualidade',  'integral', 'concluido', true),

  -- e06: NR-12 (externo — realizado)
  ('e0000000-0000-0000-0000-000000000006', NULL, 'Carlos Henrique Lima', 'M-002', 'Produção',   'tarde',    'concluido', false),
  ('e0000000-0000-0000-0000-000000000006', NULL, 'João Pedro Martins',   'M-004', 'Produção',   'tarde',    'concluido', false),
  ('e0000000-0000-0000-0000-000000000006', NULL, 'Marcos Rocha',         'M-006', 'Manutenção', 'noite',    'concluido', false),

  -- e07: Excel (planejado)
  ('e0000000-0000-0000-0000-000000000007', NULL, 'Ana Beatriz Souza',    'M-001', 'Qualidade',  'manha',    'pendente',  false),

  -- e08: Logística (planejado)
  ('e0000000-0000-0000-0000-000000000008', NULL, 'Lucia Alves',          'M-005', 'Logística',  'manha',    'pendente',  false)
ON CONFLICT DO NOTHING;

-- ─── 6. Avaliação de eficácia (avaliado_por = NULL) ───────────────────────────

INSERT INTO treinamento_avaliacao_eficacia (
  treinamento_id, eficaz, observacao, evidencia_urls, avaliado_por
) VALUES
  (
    'e0000000-0000-0000-0000-000000000001', true,
    'Todos os participantes demonstraram compreensão das técnicas de amostragem e preenchimento dos registros. Avaliação prática no dia seguinte com aprovação de 100%.',
    '[]', NULL
  ),
  (
    'e0000000-0000-0000-0000-000000000004', true,
    'Questionário aplicado 1 semana depois mostrou 85% de acerto sobre os requisitos da ISO 9001. Objetivo atingido.',
    '[]', NULL
  ),
  (
    'e0000000-0000-0000-0000-000000000005', true,
    'Participantes aprovados no exame IRCA com nota média 78%. Certificados emitidos pela Bureau Veritas.',
    '[]', NULL
  ),
  (
    'e0000000-0000-0000-0000-000000000006', false,
    'Avaliação prática identificou que 2 dos 3 participantes não conseguiram identificar os dispositivos de proteção conforme NR-12. Ação planejada: re-treinamento prático previsto para julho/2026.',
    '[]', NULL
  )
ON CONFLICT DO NOTHING;

-- ─── 7. LNT 2026 + 2025 (criado_por = NULL) ──────────────────────────────────

INSERT INTO treinamento_lnt (
  area_id, ano, treinamento_nome, descricao, justificativa,
  prioridade, qtd_pessoas, carga_horaria_estimada, status, criado_por
) VALUES
  ('a2000000-0000-0000-0000-000000000001', 2026,
   'Operação de Torno CNC — Módulo Avançado',
   'Programação paramétrica e otimização de ciclos de usinagem.',
   'Cliente Tier 1 exige operadores qualificados no nível avançado.',
   'alta', 6, 16, 'aprovada', NULL),

  ('a2000000-0000-0000-0000-000000000002', 2026,
   'Metrologia e Calibração de Instrumentos',
   'Paquímetros, micrômetros e calibradores — rastreabilidade ao INMETRO.',
   'Auditoria identificou registros de calibração inconsistentes (req. §7.1.5).',
   'alta', 8, 8, 'identificada', NULL),

  ('a2000000-0000-0000-0000-000000000003', 2026,
   'LOTO — Bloqueio e Etiquetagem de Energias Perigosas',
   'NR-10: lockout/tagout para intervenção em equipamentos elétricos.',
   'Dois colaboradores novos na manutenção sem o treinamento obrigatório.',
   'alta', 5, 8, 'planejada', NULL),

  ('a2000000-0000-0000-0000-000000000004', 2026,
   'Integração e Onboarding — Cultura ISO 9001',
   'Programa de integração para novos colaboradores: política da qualidade e processos críticos.',
   '12 novos colaboradores sem integração formal no SGQ.',
   'media', 12, 4, 'aprovada', NULL),

  ('a2000000-0000-0000-0000-000000000005', 2026,
   'WMS — Gestão de Armazém com Software Logix',
   'Módulo de entrada e expedição do WMS Logix após upgrade de versão.',
   'Upgrade previsto para agosto/2026 — operadores precisam ser retreinados.',
   'media', 10, 12, 'identificada', NULL),

  ('a2000000-0000-0000-0000-000000000002', 2026,
   'Análise de Causa Raiz — DMAIC e 8D',
   'Metodologias DMAIC (Six Sigma) e 8D aplicadas a NCs recorrentes.',
   'Indicador de reincidência de NCs acima da meta.',
   'media', 4, 24, 'identificada', NULL),

  ('a2000000-0000-0000-0000-000000000001', 2026,
   '5S e Organização do Posto de Trabalho',
   'Reciclagem do programa 5S na área de produção.',
   'Auditoria interna identificou desvios no programa 5S.',
   'baixa', 20, 4, 'identificada', NULL),

  ('a2000000-0000-0000-0000-000000000004', 2026,
   'Legislação Trabalhista Básica para Líderes',
   'Direitos e deveres, jornada, banco de horas e documentação.',
   'Mudanças na CLT impactam contratos — líderes precisam ser atualizados.',
   'baixa', 8, 8, 'identificada', NULL),

  -- 2025 (para testar o filtro de ano)
  ('a2000000-0000-0000-0000-000000000002', 2025,
   'Auditor Interno ISO 9001',
   'Formação de auditores internos para o ciclo de auditorias 2025.',
   'Plano de auditoria exige pelo menos 3 auditores qualificados.',
   'alta', 3, 32, 'concluida', NULL),

  ('a2000000-0000-0000-0000-000000000001', 2025,
   'Controle Estatístico de Processo (CEP)',
   'Gráficos de controle, limites de especificação, variáveis e atributos.',
   'Meta de redução de refugos exige monitoramento estatístico.',
   'media', 5, 16, 'concluida', NULL)
ON CONFLICT DO NOTHING;

-- ─── Resumo ────────────────────────────────────────────────────────────────────
SELECT 'treinamentos'       AS tabela, count(*)::int AS total FROM treinamentos                  WHERE id LIKE 'e0000000%'
UNION ALL
SELECT 'participantes',                count(*)::int          FROM treinamento_participantes tp   JOIN treinamentos t ON t.id = tp.treinamento_id WHERE t.id LIKE 'e0000000%'
UNION ALL
SELECT 'avaliacoes_eficacia',          count(*)::int          FROM treinamento_avaliacao_eficacia JOIN treinamentos t ON t.id = treinamento_id    WHERE t.id LIKE 'e0000000%'
UNION ALL
SELECT 'lnt_2026',                     count(*)::int          FROM treinamento_lnt               WHERE ano = 2026
UNION ALL
SELECT 'lnt_2025',                     count(*)::int          FROM treinamento_lnt               WHERE ano = 2025;
