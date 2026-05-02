// =============================================================
// Fly ISO — Mock Data (substituto temporário até Supabase estar wired)
// =============================================================

export type DocumentoStatus = 'aprovado' | 'em_aprovacao' | 'rascunho' | 'obsoleto'
export type DocumentoTipo = 'Manual' | 'Procedimento' | 'Instrução' | 'Formulário' | 'Política'

export interface MockDocumento {
  id: string
  codigo: string
  titulo: string
  descricao: string
  tipo: DocumentoTipo
  versao: string
  status: DocumentoStatus
  area: string
  responsavel: string
  responsavelAvatar?: string
  dataAtualizacao: string
  dataVigencia?: string
  autor?: string
  revisor?: string
  aprovador?: string
}

export const mockDocumentos: MockDocumento[] = [
  {
    id: '1',
    codigo: 'DOC-001',
    titulo: 'Manual de Gestão da Qualidade',
    descricao: 'Documento raiz do SGQ conforme ISO 9001:2015',
    tipo: 'Manual',
    versao: 'v4.2',
    status: 'aprovado',
    area: 'Gestão',
    responsavel: 'Sarah Johnson',
    dataAtualizacao: '12 Out, 2023',
    dataVigencia: '24 de Out, 2023',
    autor: 'Jane Doe',
    revisor: 'Marcus Aurelius',
    aprovador: 'Gareth Conner',
  },
  {
    id: '2',
    codigo: 'SOP-204',
    titulo: 'Procedimento de Manuseio de Materiais',
    descricao: 'Define os padrões de manuseio seguro e rastreável',
    tipo: 'Procedimento',
    versao: 'v2.0',
    status: 'em_aprovacao',
    area: 'Operações',
    responsavel: 'Marcus Dias',
    dataAtualizacao: '05 Nov, 2023',
  },
  {
    id: '3',
    codigo: 'WI-089',
    titulo: 'Instrução de Trabalho de Calibração',
    descricao: 'Instrução técnica para calibração de equipamentos P&D',
    tipo: 'Instrução',
    versao: 'v1.1',
    status: 'aprovado',
    area: 'P&D',
    responsavel: 'Daria Rodriguez',
    dataAtualizacao: '01 Dez, 2023',
  },
  {
    id: '4',
    codigo: 'FRM-012',
    titulo: 'Formulário de Relatório de Incidentes',
    descricao: 'Registro padronizado de incidentes EHS',
    tipo: 'Formulário',
    versao: 'v3.5',
    status: 'aprovado',
    area: 'EHS',
    responsavel: 'David S.',
    dataAtualizacao: '14 Dez, 2023',
  },
  {
    id: '5',
    codigo: 'POL-005',
    titulo: 'Política de Privacidade de Dados',
    descricao: 'Conformidade LGPD e segurança da informação',
    tipo: 'Política',
    versao: 'v1.0',
    status: 'rascunho',
    area: 'TI / Segurança',
    responsavel: 'Sophie Lane',
    dataAtualizacao: '02 Jan, 2024',
  },
]

// =============================================================
// Não Conformidades (NC)
// =============================================================

export type NCGravidade = 'menor' | 'maior' | 'critica'
export type NCStatus   = 'aberta' | 'investigando' | 'vinculado_capa' | 'fechado'
export type NCOrigem   = 'Auditoria Interna' | 'Auditoria Externa' | 'Processo' | 'Reclamação' | 'Cliente' | 'Fornecedor'

export interface MockNC {
  id: string
  codigo: string
  titulo: string
  descricao: string
  origem: NCOrigem
  gravidade: NCGravidade
  area: string
  unidade: string
  responsavel: string
  responsavelInitials: string
  responsavelColor: string
  status: NCStatus
  dataRegistro: string
  isoClausula?: string
}

export const mockNCs: MockNC[] = [
  {
    id: 'nc-102',
    codigo: 'NC-102',
    titulo: 'Desvio na Logística da Cadeia de Frio',
    descricao: 'Desvio de temperatura ambiente de 4°C por 40 min durante carregamento do E-402.',
    origem: 'Auditoria Interna',
    gravidade: 'maior',
    area: 'Produção',
    unidade: 'Ala de Esterilização',
    responsavel: 'Jane Doe',
    responsavelInitials: 'JD',
    responsavelColor: 'bg-blue-100 text-blue-700',
    status: 'investigando',
    dataRegistro: '12 Out, 2023',
    isoClausula: 'ISO 9001:2015 — Cláusula 9.1.1',
  },
  {
    id: 'nc-105',
    codigo: 'NC-105',
    titulo: 'Erro de Documentação',
    descricao: 'Assinatura ausente no Lote #442.',
    origem: 'Processo',
    gravidade: 'menor',
    area: 'Garantia da Qualidade',
    unidade: 'Depto. de Embalagem',
    responsavel: 'M. Ross',
    responsavelInitials: 'MR',
    responsavelColor: 'bg-slate-100 text-slate-700',
    status: 'fechado',
    dataRegistro: '10 Out, 2023',
    isoClausula: 'ISO 9001:2015 — Cláusula 7.5.3',
  },
  {
    id: 'nc-098',
    codigo: 'NC-098',
    titulo: 'Contaminação de Material',
    descricao: 'Potenciais traços de impurezas detectados no lote de entrada.',
    origem: 'Auditoria Externa',
    gravidade: 'critica',
    area: 'Serviços de Lab',
    unidade: 'Logística de Entrada',
    responsavel: 'S. Tanaka',
    responsavelInitials: 'ST',
    responsavelColor: 'bg-purple-100 text-purple-700',
    status: 'vinculado_capa',
    dataRegistro: '08 Out, 2023',
    isoClausula: 'ISO 9001:2015 — Cláusula 8.5.1',
  },
  {
    id: 'nc-109',
    codigo: 'NC-109',
    titulo: 'Feedback do Cliente',
    descricao: 'Comportamento inesperado no módulo de Software relatado pelo cliente.',
    origem: 'Cliente',
    gravidade: 'maior',
    area: 'Qualidade de Software',
    unidade: 'Núcleo de QA',
    responsavel: 'A. Hall',
    responsavelInitials: 'AH',
    responsavelColor: 'bg-emerald-100 text-emerald-700',
    status: 'aberta',
    dataRegistro: '14 Out, 2023',
    isoClausula: 'ISO 9001:2015 — Cláusula 9.1.2',
  },
  {
    id: 'nc-111',
    codigo: 'NC-111',
    titulo: 'Revisão de Calibração Pendente',
    descricao: 'Instrumento SN-1204 fora do intervalo de calibração.',
    origem: 'Auditoria Interna',
    gravidade: 'menor',
    area: 'Metrologia',
    unidade: 'Lab. Central',
    responsavel: 'C. Alves',
    responsavelInitials: 'CA',
    responsavelColor: 'bg-amber-100 text-amber-700',
    status: 'investigando',
    dataRegistro: '16 Out, 2023',
    isoClausula: 'ISO 9001:2015 — Cláusula 7.1.5',
  },
]

export interface MockNCComentario {
  autor: string
  iniciais: string
  avatarBg: string
  tempo: string
  texto: string
}

export interface MockNCEvidencia {
  tipo: 'image' | 'pdf' | 'log'
  nome: string
  label: string
}

export const mockNCDetalhe: MockNC & {
  progressao: { label: string; data: string; autor: string; ativo: boolean; primeiro?: boolean }[]
  evidencias: MockNCEvidencia[]
  isoDescricao: string
  auditores: string[]
  comentarios: MockNCComentario[]
} = {
  ...mockNCs[0],
  progressao: [
    { label: 'Aberta',            data: '12 Out, 2023', autor: 'Por Sarah Jenkins',  ativo: true, primeiro: true },
    { label: 'Classificada',      data: 'Nível: MAIOR',  autor: 'Via IA-Assist Score', ativo: true },
    { label: 'Vinculada a CAPA',  data: 'Pendente',     autor: 'Iniciar CAPA',        ativo: false },
    { label: 'Fechada',           data: 'Pendente',     autor: '',                    ativo: false },
  ],
  evidencias: [
    { tipo: 'image', nome: 'sensor-log-4c.jpg',    label: 'Log do Sensor' },
    { tipo: 'image', nome: 'dashboard-backup.png', label: 'Painel Backup' },
    { tipo: 'log',   nome: 'carga-e402.log',       label: 'Log E-402' },
  ],
  isoDescricao:
    'A organização deve monitorar, medir, analisar e avaliar os resultados necessários para garantir resultados válidos.',
  auditores: ['Marcus Thorne'],
  comentarios: [
    {
      autor: 'Marcus Thorne',
      iniciais: 'MT',
      avatarBg: 'bg-blue-100 text-blue-700',
      tempo: '2 dias atrás',
      texto:
        'Revisei os logs de calibração dos últimos 6 meses. O ciclo de manutenção do centro de distribuição parece inconsistente. Precisamos verificar se o padrão se repete em outras unidades.',
    },
    {
      autor: 'Sarah Jenkins',
      iniciais: 'SJ',
      avatarBg: 'bg-purple-100 text-purple-700',
      tempo: '1 dia atrás',
      texto:
        'Concordo. Estou anexando o relatório de agendamento de manutenção. Também vou puxar a cadeia de notificação de alerta que passou pelo dispositivo móvel do supervisor.',
    },
  ],
}

export const mockNCDashboard = {
  ncsAbertas: 14,
  ncsEmTratamento: 8,
  ncsFechadasMes: 22,
  mediaResolucaoDias: 5,
  scoreConformidade: 94,
  deltaAbertas: '-10%',
  deltaFechadas: '+1',
  origens: [
    { label: 'Cliente',           percent: 62, color: 'bg-blue-700' },
    { label: 'Auditoria Interna', percent: 28, color: 'bg-blue-400' },
    { label: 'Auditoria Externa', percent: 18, color: 'bg-red-500' },
    { label: 'Fornecedor',        percent: 12, color: 'bg-amber-500' },
  ],
  areas: [
    { label: 'Operações', valor: 9 },
    { label: 'TI',        valor: 6 },
    { label: 'RH',        valor: 3 },
    { label: 'Vendas',    valor: 5 },
  ],
  tendencia: [
    { mes: 'JAN', ncs: 6 },
    { mes: 'FEV', ncs: 8 },
    { mes: 'MAR', ncs: 5 },
    { mes: 'ABR', ncs: 11 },
    { mes: 'MAI', ncs: 9 },
    { mes: 'JUN', ncs: 14 },
  ],
  acoesPendentes: [
    { titulo: 'Revisar Análise de Causa Raiz',         codigo: 'NC-2023-008 · Linha de Produção B', prioridade: 'alta' as const },
    { titulo: 'Plano de Ação Corretivo do Fornecedor', codigo: 'NC-2023-009 · Logística Inc.',       prioridade: 'recente' as const },
  ],
}

export const mockDocumentoDetalhe: MockDocumento & {
  conteudo: string
  versoes: { numero: string; label: string; data: string; autor: string; note: string }[]
  distribuicao: { unidade: string; status: 'confirmado' | 'pendente' }[]
} = {
  ...mockDocumentos[0],
  conteudo: `
## 1. Objetivo e Escopo

Este Manual de Qualidade descreve o compromisso do Padrão de Qualidade Sovereign com a excelência e a conformidade com a ISO 9001:2015. Ele define a estrutura para nossos processos de gestão e a direção estratégica de nossos sistemas de controle de documentos.

## 2. Contexto Organizacional

Oferecemos uma cultura curada onde a conformidade é integrada ao tecido arquitetônico de nossas operações diárias. Nossa regra "Sem Linhas" garante que os dados continuem sendo o foco principal de cada ciclo de auditoria e revisão de documentos.

> *"O Curador Arquitetônico: Transformando a conformidade de um fardo em uma experiência executiva autoritária."*

## 3. Ciclo de Vida do Documento

Cada documento centro deste sistema segue um fluxo rigoroso de criação, revisão, aprovação e distribuição. Os metadados são preservados em todas as versões para garantir uma trilha de auditoria à prova de balas.
  `,
  versoes: [
    { numero: 'v2.0', label: 'Atual', data: '14 Out, 2023', autor: 'Aprovado: Sarah C.', note: '' },
    { numero: 'v1.1', label: 'Revisado', data: '08 Jun, 2023', autor: 'Revisado: Marcus A.', note: '' },
    { numero: 'v1.0', label: 'Lançamento Inicial', data: '01 Jan, 2023', autor: 'Autor: Jane Doe', note: '' },
  ],
  distribuicao: [
    { unidade: 'Unidade A - Manufatura', status: 'confirmado' },
    { unidade: 'Unidade B - Lab. de Qualidade', status: 'confirmado' },
    { unidade: 'Unidade C - Logística', status: 'pendente' },
  ],
}
