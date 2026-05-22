import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { RegistroTipoRow } from '@/lib/queries/registro-tipos'

export type RegistroRow = {
  id: string
  titulo: string
  tipo: string | null              // legado (string livre)
  tipo_id: string | null           // novo (FK para registro_tipos)
  codigo: string | null
  dados: Record<string, unknown>   // valores dos campos customizáveis
  politica_id: string | null
  documento_id: string | null
  area_id: string | null
  responsavel_id: string | null
  arquivo_url: string | null
  status: string
  data_criacao: string | null
  data_arquivamento: string | null
  data_descarte: string | null
  prazo_descarte: string | null
  arquivado_em: string | null
  created_at: string
  updated_at: string
}

export type RegistroComRelacoes = RegistroRow & {
  areas: { nome: string } | null
  responsavel: { nome: string } | null
  tipo_def: Pick<RegistroTipoRow, 'id' | 'codigo' | 'nome' | 'campos'> | null
}

interface ListOpts {
  tipoId?: string
  status?: string
  vencidos?: boolean   // prazo_descarte < hoje && !arquivado_em
}

/**
 * Lista registros + faz joins manuais com areas, usuarios e registro_tipos.
 * Evita depender de relacionamentos PostgREST (que precisam de reload de cache
 * após migration).
 */
export async function listRegistros(opts: ListOpts = {}): Promise<RegistroComRelacoes[]> {
  // Service client: bypass RLS — autorização é feita na camada de UI / actions.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (sb as any).from('registros').select('*').order('created_at', { ascending: false })

  if (opts.tipoId) q = q.eq('tipo_id', opts.tipoId)
  if (opts.status) q = q.eq('status', opts.status)
  if (opts.vencidos) {
    const hoje = new Date().toISOString().split('T')[0]
    q = q.lt('prazo_descarte', hoje).is('arquivado_em', null)
  }

  const { data, error } = await q
  if (error) { console.error('[listRegistros]', error.message); return [] }
  const rows = (data ?? []) as RegistroRow[]
  if (rows.length === 0) return []

  return enriquecerRegistros(rows, sb)
}

export async function getRegistro(id: string): Promise<RegistroComRelacoes | null> {
  // Service client: bypass RLS — autorização é feita na camada de UI / actions.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb as any)
    .from('registros').select('*').eq('id', id).maybeSingle()

  if (error) { console.error('[getRegistro]', error.message); return null }
  if (!data) return null

  const enriched = await enriquecerRegistros([data as RegistroRow], sb)
  return enriched[0] ?? null
}

/**
 * Faz joins manuais para evitar problemas de FK não-cacheada no PostgREST.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enriquecerRegistros(rows: RegistroRow[], sb: any): Promise<RegistroComRelacoes[]> {
  const areaIds       = [...new Set(rows.map((r) => r.area_id).filter(Boolean) as string[])]
  const responsavelIds = [...new Set(rows.map((r) => r.responsavel_id).filter(Boolean) as string[])]
  const tipoIds       = [...new Set(rows.map((r) => r.tipo_id).filter(Boolean) as string[])]

  const [areasRes, usrRes, tiposRes] = await Promise.all([
    areaIds.length
      ? sb.from('areas').select('id, nome').in('id', areaIds)
      : Promise.resolve({ data: [] }),
    responsavelIds.length
      ? sb.from('usuarios').select('id, nome').in('id', responsavelIds)
      : Promise.resolve({ data: [] }),
    tipoIds.length
      ? sb.from('registro_tipos').select('id, codigo, nome, campos').in('id', tipoIds)
      : Promise.resolve({ data: [] }),
  ])

  const areaMap = new Map<string, { nome: string }>()
  for (const a of (areasRes.data ?? []) as Array<{ id: string; nome: string }>) areaMap.set(a.id, { nome: a.nome })

  const usrMap = new Map<string, { nome: string }>()
  for (const u of (usrRes.data ?? []) as Array<{ id: string; nome: string }>) usrMap.set(u.id, { nome: u.nome })

  const tipoMap = new Map<string, Pick<RegistroTipoRow, 'id' | 'codigo' | 'nome' | 'campos'>>()
  for (const t of (tiposRes.data ?? []) as Array<Pick<RegistroTipoRow, 'id' | 'codigo' | 'nome' | 'campos'>>) {
    tipoMap.set(t.id, t)
  }

  return rows.map((r) => ({
    ...r,
    areas:       r.area_id        ? (areaMap.get(r.area_id) ?? null)         : null,
    responsavel: r.responsavel_id ? (usrMap.get(r.responsavel_id) ?? null)    : null,
    tipo_def:    r.tipo_id        ? (tipoMap.get(r.tipo_id) ?? null)          : null,
  }))
}

export type RegistroStats = {
  total: number
  ativos: number
  arquivados: number
  descartados: number
  vencidos: number
}

export async function getRegistroStats(): Promise<RegistroStats> {
  // Service client: bypass RLS — autorização é feita na camada de UI / actions.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb as any)
    .from('registros').select('status, prazo_descarte, arquivado_em')
  if (error) {
    console.error('[getRegistroStats]', error.message)
    return { total: 0, ativos: 0, arquivados: 0, descartados: 0, vencidos: 0 }
  }
  const rows = (data ?? []) as Array<{ status: string; prazo_descarte: string | null; arquivado_em: string | null }>
  const hoje = new Date().toISOString().split('T')[0]
  return {
    total:       rows.length,
    ativos:      rows.filter((r) => r.status === 'ativo').length,
    arquivados:  rows.filter((r) => r.status === 'arquivado').length,
    descartados: rows.filter((r) => r.status === 'descartado').length,
    vencidos:    rows.filter((r) =>
      r.status === 'ativo' && !r.arquivado_em && r.prazo_descarte && r.prazo_descarte < hoje
    ).length,
  }
}
