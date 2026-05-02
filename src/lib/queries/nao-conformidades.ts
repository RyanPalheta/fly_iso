import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { NaoConformidade, NCStatus, NCSeveridade } from '@/types/database'

export type NCComRelacoes = NaoConformidade & {
  areas: { id: string; nome: string; unidades: { nome: string } | null } | null
  responsavel: { id: string; nome: string; email: string } | null
  detector: { id: string; nome: string; email: string } | null
}

export interface NCFilters {
  status?: NCStatus | NCStatus[]
  severidade?: NCSeveridade | NCSeveridade[]
  areaId?: string
}

/**
 * Lista NCs com área + unidade + responsável + detector.
 * RLS aplica: Admin/Qualidade vê tudo; outros veem por unidade.
 */
export async function listNCs(filters: NCFilters = {}): Promise<NCComRelacoes[]> {
  const sb = await createClient()
  let q = sb
    .from('nao_conformidades')
    .select(`
      *,
      areas ( id, nome, unidades ( nome ) ),
      responsavel:usuarios!nao_conformidades_responsavel_id_fkey ( id, nome, email ),
      detector:usuarios!nao_conformidades_detectado_por_fkey ( id, nome, email )
    `)
    .order('created_at', { ascending: false })

  if (filters.status) {
    q = Array.isArray(filters.status) ? q.in('status', filters.status) : q.eq('status', filters.status)
  }
  if (filters.severidade) {
    q = Array.isArray(filters.severidade) ? q.in('severidade', filters.severidade) : q.eq('severidade', filters.severidade)
  }
  if (filters.areaId) q = q.eq('area_id', filters.areaId)

  const { data, error } = await q
  if (error) throw new Error(`Erro ao listar NCs: ${error.message}`)
  return (data ?? []) as unknown as NCComRelacoes[]
}

/** Busca uma NC por id com todos os relacionamentos. */
export async function getNC(id: string): Promise<NCComRelacoes | null> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('nao_conformidades')
    .select(`
      *,
      areas ( id, nome, unidades ( nome ) ),
      responsavel:usuarios!nao_conformidades_responsavel_id_fkey ( id, nome, email ),
      detector:usuarios!nao_conformidades_detectado_por_fkey ( id, nome, email )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`Erro ao buscar NC ${id}: ${error.message}`)
  return (data as unknown as NCComRelacoes | null) ?? null
}

/** Busca por código (ex: "NC-102"). */
export async function getNCByCodigo(codigo: string): Promise<NCComRelacoes | null> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('nao_conformidades')
    .select(`
      *,
      areas ( id, nome, unidades ( nome ) ),
      responsavel:usuarios!nao_conformidades_responsavel_id_fkey ( id, nome, email ),
      detector:usuarios!nao_conformidades_detectado_por_fkey ( id, nome, email )
    `)
    .eq('codigo', codigo)
    .maybeSingle()

  if (error) throw new Error(`Erro ao buscar NC ${codigo}: ${error.message}`)
  return (data as unknown as NCComRelacoes | null) ?? null
}

export interface NCStats {
  total: number
  abertas: number
  emTratamento: number
  encerradas: number
  criticas: number
  porSeveridade: Record<NCSeveridade, number>
  porStatus: Record<NCStatus, number>
}

/** Agrega contadores para os cards do dashboard. */
export async function getNCStats(): Promise<NCStats> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('nao_conformidades')
    .select('status, severidade')
    .returns<Array<{ status: NCStatus; severidade: NCSeveridade | null }>>()
  if (error) throw new Error(`Erro ao agregar NCs: ${error.message}`)

  const stats: NCStats = {
    total: data?.length ?? 0,
    abertas: 0, emTratamento: 0, encerradas: 0, criticas: 0,
    porSeveridade: { menor: 0, maior: 0, critica: 0 },
    porStatus: { registrada: 0, em_analise: 0, em_acao: 0, verificacao: 0, encerrada: 0 },
  }

  for (const row of data ?? []) {
    const status = row.status
    const sev = row.severidade
    stats.porStatus[status] = (stats.porStatus[status] ?? 0) + 1
    if (sev) stats.porSeveridade[sev] = (stats.porSeveridade[sev] ?? 0) + 1

    if (status === 'registrada') stats.abertas++
    else if (status === 'em_analise' || status === 'em_acao' || status === 'verificacao') stats.emTratamento++
    else if (status === 'encerrada') stats.encerradas++

    if (sev === 'critica' && status !== 'encerrada') stats.criticas++
  }

  return stats
}
