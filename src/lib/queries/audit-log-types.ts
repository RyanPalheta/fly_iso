// Shared types and constants — no 'server-only', safe to import in Client Components

export type AuditLogRow = {
  id: string
  usuario_id: string | null
  acao: string
  entidade: string
  entidade_id: string | null
  dados_anteriores: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export type AuditLogComUsuario = AuditLogRow & {
  usuario: { nome: string; email: string } | null
}

export type UsuarioBasicoAudit = { id: string; nome: string }

export type AuditLogFilters = {
  entidade?: string
  acao?: string
  usuarioId?: string
  de?: string   // ISO date
  ate?: string  // ISO date
}

export const ENTIDADES = [
  'documentos', 'nao_conformidades', 'capas', 'acoes',
  'treinamentos', 'indicadores', 'registros', 'reunioes',
  'usuarios', 'importacoes',
] as const

export const ACOES = [
  'create', 'update', 'delete', 'approve', 'reject', 'view', 'export',
] as const

export const ACAO_META: Record<string, { label: string; cls: string }> = {
  create:  { label: 'Criação',      cls: 'bg-emerald-100 text-emerald-700' },
  update:  { label: 'Edição',       cls: 'bg-blue-100 text-blue-700' },
  delete:  { label: 'Exclusão',     cls: 'bg-red-100 text-red-700' },
  approve: { label: 'Aprovação',    cls: 'bg-violet-100 text-violet-700' },
  reject:  { label: 'Rejeição',     cls: 'bg-orange-100 text-orange-700' },
  view:    { label: 'Visualização', cls: 'bg-slate-100 text-slate-600' },
  export:  { label: 'Exportação',   cls: 'bg-amber-100 text-amber-700' },
}

export const ENTIDADE_LABEL: Record<string, string> = {
  documentos:        'Documentos',
  nao_conformidades: 'Não Conformidades',
  capas:             'CAPAs',
  acoes:             'Ações',
  treinamentos:      'Treinamentos',
  indicadores:       'Indicadores',
  registros:         'Registros',
  reunioes:          'Reuniões',
  usuarios:          'Usuários',
  importacoes:       'Importações',
}
