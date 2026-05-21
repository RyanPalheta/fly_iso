-- =============================================================================
-- SEED: Treinamentos Demo
-- Popula treinamentos (interno + externo), participantes, LNT e avaliação de eficácia
-- Execute no Supabase SQL Editor (usa SERVICE ROLE — ignora RLS)
-- =============================================================================

-- ─── 1. Garantir que existem áreas e usuários ─────────────────────────────────
-- Usamos IDs fixos para facilitar reprodução. Se já existirem será ignorado via ON CONFLICT.

INSERT INTO unidades (id, nome, codigo, ativa) VALUES
  ('u-seed-01', 'Unidade São Paulo', 'SP01', true),
  ('u-seed-02', 'Unidade Campinas',  'CP01', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO areas (id, nome, unidade_id) VALUES
  ('a-seed-01', 'Produção',         'u-seed-01'),
  ('a-seed-02', 'Qualidade',        'u-seed-01'),
  ('a-seed-03', 'Manutenção',       'u-seed-01'),
  ('a-seed-04', 'RH & Treinamento', 'u-seed-02'),
  ('a-seed-05', 'Logística',        'u-seed-02')
ON CONFLICT (id) DO NOTHING;

-- Perfil padrão
INSERT INTO perfis (id, nome, descricao, permissoes) VALUES
  ('p-seed-01', 'Usuario', 'Usuário padrão (seed)', '{}')
ON CONFLICT (id) DO NOTHING;

-- Usuários de demo (IDs fixos — não usa auth.users, apenas a tabela pública)
INSERT INTO usuarios (id, nome, email, perfil_id, ativo) VALUES
  ('usr-seed-01', 'Ana Beatriz Souza',   'ana.souza@flyiso.dev',     'p-seed-01', true),
  ('usr-seed-02', 'Carlos Henrique Lima','carlos.lima@flyiso.dev',   'p-seed-01', true),
  ('usr-seed-03', 'Fernanda Costa',      'fernanda.costa@flyiso.dev','p-seed-01', true),
  ('usr-seed-04', 'João Pedro Martins',  'joao.martins@flyiso.dev',  'p-seed-01', true),
  ('usr-seed-05', 'Lucia Alves',         'lucia.alves@flyiso.dev',   'p-seed-01', true),
  ('usr-seed-06', 'Marcos Rocha',        'marcos.rocha@flyiso.dev',  'p-seed-01', true)
ON CONFLICT (id) DO NOTHING;

-- Documento vigente para vincular treinamentos internos
INSERT INTO documentos (id, codigo, titulo, tipo, area_id, responsavel_id, status, revisao_atual) VALUES
  ('doc-seed-01', 'DOC-010', 'Procedimento de Controle de Qualidade no Processo',  'Procedimento', 'a-seed-02', 'usr-seed-01', 'vigente', 2),
  ('doc-seed-02', 'DOC-011', 'Instrução de Operação de Máquina CNC',               'Instrucao',    'a-seed-01', 'usr-seed-02', 'vigente', 1),
  ('doc-seed-03', 'DOC-012', 'Manual de Manutenção Preventiva',                    'Manual',       'a-seed-03', 'usr-seed-03', 'vigente', 0)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Treinamentos INTERNOS ──────────────────────────────────────────────────

INSERT INTO treinamentos (
  id, categoria, titulo, descricao, instrutor, data_treinamento,
  validade_meses, area_id, tipo, documento_id, revisao_doc, status
) VALUES
  (
    'tr-seed-01', 'interno',
    'Controle de Qualidade no Processo Produtivo',
    'Treinamento sobre o PCP — Procedimento de Controle de Qualidade, abrangendo técnicas de amostragem, limites de aceitação e registros obrigatórios.',
    'Ana Beatriz Souza',
    '2026-03-15',
    12, 'a-seed-02', 'presencial',
    'doc-seed-01', 2,
    'realizado'
  ),
  (
    'tr-seed-02', 'interno',
    'Operação de Máquina CNC — Instrução v1',
    'Treinamento prático na instrução de operação da linha CNC, focado em segurança e parâmetros de corte.',
    'Carlos Henrique Lima',
    '2026-04-10',
    24, 'a-seed-01', 'presencial',
    'doc-seed-02', 1,
    'realizado'
  ),
  (
    'tr-seed-03', 'interno',
    'Manutenção Preventiva — Manual v0',
    'Leitura e interpretação do Manual de Manutenção Preventiva pela equipe de manutenção.',
    NULL,
    '2026-05-20',
    12, 'a-seed-03', 'leitura',
    'doc-seed-03', 0,
    'planejado'
  ),
  (
    'tr-seed-04', 'interno',
    'ISO 9001 Conscientização — SGQ Básico',
    'Sensibilização sobre os requisitos da ISO 9001:2015 para todos os colaboradores. Foco em política, objetivos e participação.',
    'Ana Beatriz Souza',
    '2026-01-20',
    12, NULL, 'presencial',
    'doc-seed-01', 2,
    'realizado'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Treinamentos EXTERNOS ─────────────────────────────────────────────────

INSERT INTO treinamentos (
  id, categoria, titulo, descricao, instrutor, data_treinamento,
  validade_meses, area_id, tipo, entidade_promotora, carga_horaria,
  mes_planejado, custo, status
) VALUES
  (
    'tr-seed-05', 'externo',
    'Lead Auditor ISO 9001:2015 — Bureau Veritas',
    'Curso de formação de Auditor Líder em Sistema de Gestão da Qualidade conforme ISO 9001:2015. 5 dias intensivos com exame de certificação IRCA.',
    'Inst. Bureau Veritas',
    '2026-04-07',
    36, 'a-seed-02', 'presencial',
    'Bureau Veritas', 40,
    '2026-04', 4500.00,
    'realizado'
  ),
  (
    'tr-seed-06', 'externo',
    'NR-12 — Segurança em Máquinas e Equipamentos',
    'Treinamento obrigatório conforme Norma Regulamentadora 12. Prevenção de acidentes em máquinas e equipamentos industriais.',
    'Inst. SENAI',
    '2026-02-18',
    24, 'a-seed-01', 'presencial',
    'SENAI', 16,
    '2026-02', 800.00,
    'realizado'
  ),
  (
    'tr-seed-07', 'externo',
    'Excel Avançado para Análise de Dados de Qualidade',
    'Dashboards, tabelas dinâmicas, gráficos de controle estatístico de processo (CEP) em Excel.',
    'Inst. Online Cursos',
    NULL,
    12, 'a-seed-02', 'online',
    'Online Cursos Pro', 20,
    '2026-06', 290.00,
    'planejado'
  ),
  (
    'tr-seed-08', 'externo',
    'Gestão de Estoque e Logística — IMAM',
    'Técnicas modernas de gestão de estoque, FIFO/FEFO, indicadores de logística.',
    'Inst. IMAM',
    NULL,
    24, 'a-seed-05', 'presencial',
    'IMAM Consultoria', 24,
    '2026-07', 1200.00,
    'planejado'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── 4. Participantes ──────────────────────────────────────────────────────────

INSERT INTO treinamento_participantes (
  treinamento_id, usuario_id, nome_snapshot, matricula, setor, turno, status, aceite_digital
) VALUES
  -- tr-seed-01: Controle de Qualidade (realizado)
  ('tr-seed-01', 'usr-seed-01', 'Ana Beatriz Souza',   'M-001', 'Qualidade',  'manha',  'concluido', true),
  ('tr-seed-01', 'usr-seed-03', 'Fernanda Costa',      'M-003', 'Qualidade',  'tarde',  'concluido', true),
  ('tr-seed-01', 'usr-seed-05', 'Lucia Alves',         'M-005', 'Produção',   'manha',  'concluido', false),
  ('tr-seed-01', NULL,          'Roberto Nascimento',  'M-010', 'Qualidade',  'manha',  'ausente',   false),

  -- tr-seed-02: CNC (realizado)
  ('tr-seed-02', 'usr-seed-02', 'Carlos Henrique Lima','M-002', 'Produção',   'tarde',  'concluido', true),
  ('tr-seed-02', 'usr-seed-04', 'João Pedro Martins',  'M-004', 'Produção',   'tarde',  'concluido', true),
  ('tr-seed-02', 'usr-seed-06', 'Marcos Rocha',        'M-006', 'Produção',   'noite',  'concluido', false),
  ('tr-seed-02', NULL,          'Paulo César Dias',    'M-011', 'Produção',   'integral','pendente',  false),

  -- tr-seed-03: Manutenção (planejado)
  ('tr-seed-03', 'usr-seed-06', 'Marcos Rocha',        'M-006', 'Manutenção', 'noite',  'pendente',  false),
  ('tr-seed-03', NULL,          'Sergio Lopes',        'M-012', 'Manutenção', 'tarde',  'pendente',  false),

  -- tr-seed-04: ISO Conscientização (realizado) — toda a equipe
  ('tr-seed-04', 'usr-seed-01', 'Ana Beatriz Souza',   'M-001', 'Qualidade',  'manha',  'concluido', true),
  ('tr-seed-04', 'usr-seed-02', 'Carlos Henrique Lima','M-002', 'Produção',   'tarde',  'concluido', true),
  ('tr-seed-04', 'usr-seed-03', 'Fernanda Costa',      'M-003', 'Qualidade',  'tarde',  'concluido', true),
  ('tr-seed-04', 'usr-seed-04', 'João Pedro Martins',  'M-004', 'Produção',   'tarde',  'concluido', false),
  ('tr-seed-04', 'usr-seed-05', 'Lucia Alves',         'M-005', 'Produção',   'manha',  'concluido', false),
  ('tr-seed-04', 'usr-seed-06', 'Marcos Rocha',        'M-006', 'Manutenção', 'noite',  'ausente',   false),

  -- tr-seed-05: Lead Auditor (externo — realizado)
  ('tr-seed-05', 'usr-seed-01', 'Ana Beatriz Souza',   'M-001', 'Qualidade',  'integral','concluido', true),
  ('tr-seed-05', 'usr-seed-03', 'Fernanda Costa',      'M-003', 'Qualidade',  'integral','concluido', true),

  -- tr-seed-06: NR-12 (externo — realizado)
  ('tr-seed-06', 'usr-seed-02', 'Carlos Henrique Lima','M-002', 'Produção',   'tarde',  'concluido', false),
  ('tr-seed-06', 'usr-seed-04', 'João Pedro Martins',  'M-004', 'Produção',   'tarde',  'concluido', false),
  ('tr-seed-06', 'usr-seed-06', 'Marcos Rocha',        'M-006', 'Manutenção', 'noite',  'concluido', false),

  -- tr-seed-07: Excel (planejado)
  ('tr-seed-07', 'usr-seed-01', 'Ana Beatriz Souza',   'M-001', 'Qualidade',  'manha',  'pendente',  false),

  -- tr-seed-08: Logística (planejado)
  ('tr-seed-08', 'usr-seed-05', 'Lucia Alves',         'M-005', 'Logística',  'manha',  'pendente',  false)
ON CONFLICT DO NOTHING;

-- ─── 5. Avaliação de eficácia (treinamentos realizados) ───────────────────────

-- Atenção: avaliado_por precisa ser um uuid de auth.users ou NULL.
-- Usamos NULL para o seed funcionar sem auth real.

INSERT INTO treinamento_avaliacao_eficacia (
  treinamento_id, eficaz, observacao, evidencia_urls, avaliado_por
) VALUES
  (
    'tr-seed-01', true,
    'O treinamento atingiu os objetivos: todos os participantes demonstraram compreensão das técnicas de amostragem e preenchimento dos registros. Avaliação prática realizada no dia seguinte com aprovação de 100%.',
    '[]',
    NULL
  ),
  (
    'tr-seed-04', true,
    'Conscientização bem-sucedida — questionário de verificação aplicado 1 semana após o treinamento mostrou índice de 85% de acerto sobre os requisitos da ISO 9001. Objetivo atingido.',
    '[]',
    NULL
  ),
  (
    'tr-seed-05', true,
    'Participantes aprovados no exame IRCA de Auditor Líder com nota média 78%. Certificados emitidos pela Bureau Veritas. Treinamento plenamente eficaz.',
    '[]',
    NULL
  ),
  (
    'tr-seed-06', false,
    'O treinamento não atingiu totalmente os objetivos: avaliação prática de segurança identificou que 2 dos 3 participantes não conseguiram identificar os dispositivos de proteção conforme exigido pela NR-12. Ação planejada: re-treinamento focado em prática de identificação, previsto para julho/2026.',
    '[]',
    NULL
  )
ON CONFLICT DO NOTHING;

-- ─── 6. LNT — Levantamento de Necessidades 2026 ───────────────────────────────

INSERT INTO treinamento_lnt (
  area_id, ano, treinamento_nome, descricao, justificativa,
  prioridade, qtd_pessoas, carga_horaria_estimada, status, criado_por
) VALUES
  (
    'a-seed-01', 2026,
    'Operação de Torno CNC — Módulo Avançado',
    'Treinamento avançado para operadores de torno CNC — programação paramétrica e otimização de ciclos.',
    'Requisito para certificação de produto — cliente Tier 1 exige operadores qualificados no nível avançado.',
    'alta', 6, 16, 'aprovada', NULL
  ),
  (
    'a-seed-02', 2026,
    'Metrologia e Calibração de Instrumentos',
    'Uso correto de paquímetros, micrômetros e calibradores conforme rastreabilidade ao INMETRO.',
    'Auditoria interna identificou registros de calibração inconsistentes — req. ISO 9001 §7.1.5.',
    'alta', 8, 8, 'identificada', NULL
  ),
  (
    'a-seed-03', 2026,
    'LOTO — Bloqueio e Etiquetagem de Energias Perigosas',
    'NR-10 aplicada à manutenção: procedimentos de lockout/tagout para intervenção em equipamentos elétricos.',
    'Obrigação legal — NR-10. Dois colaboradores novos na equipe de manutenção sem o treinamento.',
    'alta', 5, 8, 'planejada', NULL
  ),
  (
    'a-seed-04', 2026,
    'Integração e Onboarding — Cultura ISO 9001',
    'Programa de integração para novos colaboradores com foco na política da qualidade e processos críticos.',
    'Alta rotatividade no semestre — 12 novos colaboradores sem integração formal no SGQ.',
    'media', 12, 4, 'aprovada', NULL
  ),
  (
    'a-seed-05', 2026,
    'WMS — Gestão de Armazém com Software Logix',
    'Treinamento no módulo de entrada e expedição do WMS Logix após upgrade de versão.',
    'Upgrade do sistema previsto para agosto/2026 — todos os operadores precisam ser retreinados.',
    'media', 10, 12, 'identificada', NULL
  ),
  (
    'a-seed-02', 2026,
    'Análise de Causa Raiz — DMAIC e 8D',
    'Metodologias de resolução de problemas: DMAIC (Six Sigma) e 8D (Ford). Aplicação em NCs recorrentes.',
    'Indicador de reincidência de NCs acima da meta — plano de melhoria exige analistas capacitados.',
    'media', 4, 24, 'identificada', NULL
  ),
  (
    'a-seed-01', 2026,
    '5S e Organização do Posto de Trabalho',
    'Implantação e manutenção do programa 5S na área de produção.',
    'Auditoria interna identificou desvios no programa 5S — treinamento de reciclagem necessário.',
    'baixa', 20, 4, 'identificada', NULL
  ),
  (
    'a-seed-04', 2026,
    'Legislação Trabalhista Básica para Líderes',
    'Direitos e deveres, jornada de trabalho, banco de horas e documentação de pessoal.',
    'Atualização legislativa — mudanças na CLT impactam contratos. Líderes precisam ser atualizados.',
    'baixa', 8, 8, 'identificada', NULL
  ),
  -- 2025 (ano anterior para testar o filtro de ano)
  (
    'a-seed-02', 2025,
    'Auditor Interno ISO 9001',
    'Formação de auditores internos para o ciclo de auditorias 2025.',
    'Plano de auditoria interna exige pelo menos 3 auditores qualificados.',
    'alta', 3, 32, 'concluida', NULL
  ),
  (
    'a-seed-01', 2025,
    'Controle Estatístico de Processo (CEP)',
    'Introdução ao CEP: gráficos de controle, limites de especificação, CEP por variáveis e atributos.',
    'Meta de redução de refugos exige monitoramento estatístico nos postos críticos.',
    'media', 5, 16, 'concluida', NULL
  )
ON CONFLICT DO NOTHING;

-- ─── 7. Resumo ────────────────────────────────────────────────────────────────
SELECT 'treinamentos' AS tabela, count(*) AS total FROM treinamentos WHERE id LIKE 'tr-seed-%'
UNION ALL
SELECT 'participantes', count(*) FROM treinamento_participantes tp
  JOIN treinamentos t ON t.id = tp.treinamento_id WHERE t.id LIKE 'tr-seed-%'
UNION ALL
SELECT 'avaliacoes_eficacia', count(*) FROM treinamento_avaliacao_eficacia tae
  JOIN treinamentos t ON t.id = tae.treinamento_id WHERE t.id LIKE 'tr-seed-%'
UNION ALL
SELECT 'lnt_2026', count(*) FROM treinamento_lnt WHERE ano = 2026
UNION ALL
SELECT 'lnt_2025', count(*) FROM treinamento_lnt WHERE ano = 2025;
