import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type {
  AuditLogRow,
  AuditLogComUsuario,
  UsuarioBasicoAudit,
  AuditLogFilters,
} from './audit-log-types'

export {
  ENTIDADES,
  ACOES,
  ACAO_META,
  ENTIDADE_LABEL,
} from './audit-log-types'

import type { AuditLogFilters, AuditLogComUsuario, UsuarioBasicoAudit } from './audit-log-types'

export async function listAuditLog(
  filters: AuditLogFilters = {},
  limit = 100,
  offset = 0
): Promise<{ rows: AuditLogComUsuario[]; total: number }> {
  const sb = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (sb as any)
    .from('audit_log')
    .select(`
      *,
      usuario:usuarios!usuario_id ( nome, email )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters.entidade)  q = q.eq('entidade', filters.entidade)
  if (filters.acao)      q = q.eq('acao', filters.acao)
  if (filters.usuarioId) q = q.eq('usuario_id', filters.usuarioId)
  if (filters.de)        q = q.gte('created_at', filters.de)
  if (filters.ate)       q = q.lte('created_at', filters.ate + 'T23:59:59Z')

  const { data, error, count } = await q

  if (error) { console.error('listAuditLog', error); return { rows: [], total: 0 } }
  return {
    rows:  (data ?? []) as AuditLogComUsuario[],
    total: count ?? 0,
  }
}

export async function listUsuariosParaFiltro(): Promise<UsuarioBasicoAudit[]> {
  const sb = await createClient()
  const { data } = await (sb as any).from('usuarios').select('id, nome').order('nome')
  return (data ?? []) as UsuarioBasicoAudit[]
}

/** Registra uma entrada no audit log (use em server actions) */
export async function registrarAuditLog(entry: {
  usuarioId: string
  acao: string
  entidade: string
  entidadeId?: string
  dadosAnteriores?: Record<string, unknown>
  dadosNovos?: Record<string, unknown>
}) {
  const { createServiceClient } = await import('@/lib/supabase/server')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  await sb.from('audit_log').insert({
    usuario_id:       entry.usuarioId,
    acao:             entry.acao,
    entidade:         entry.entidade,
    entidade_id:      entry.entidadeId ?? null,
    dados_anteriores: entry.dadosAnteriores ?? null,
    dados_novos:      entry.dadosNovos ?? null,
  })
}
