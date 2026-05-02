import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

export interface NCAgrupadaStatus {
  id: string
  codigo: string
  titulo: string
  severidade: string
  status: string
  responsavel: string | null
  area: string | null
  created_at: string
}

export interface NCParetoItem {
  categoria: string
  total: number
  acumulado: number
  percentualAcumulado: number
}

export interface NCKanbanData {
  registrada:  NCAgrupadaStatus[]
  em_analise:  NCAgrupadaStatus[]
  em_acao:     NCAgrupadaStatus[]
  verificacao: NCAgrupadaStatus[]
  encerrada:   NCAgrupadaStatus[]
}

/** Busca dados para Kanban — todas as NCs não encerradas + encerradas últimos 30 dias */
export async function getNCKanbanData(): Promise<NCKanbanData> {
  const sb = createServiceClient()

  const { data } = await sb
    .from('nao_conformidades')
    .select(`
      id, codigo, titulo, severidade, status, created_at,
      responsavel:usuarios!responsavel_id(nome),
      area:areas!area_id(nome)
    `)
    .or('status.neq.encerrada,encerrada_em.gte.' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    id:          r.id as string,
    codigo:      r.codigo as string,
    titulo:      r.titulo as string,
    severidade:  r.severidade as string,
    status:      r.status as string,
    created_at:  r.created_at as string,
    responsavel: (r.responsavel as { nome: string } | null)?.nome ?? null,
    area:        (r.area as { nome: string } | null)?.nome ?? null,
  }))

  return {
    registrada:  rows.filter(r => r.status === 'registrada'),
    em_analise:  rows.filter(r => r.status === 'em_analise'),
    em_acao:     rows.filter(r => r.status === 'em_acao'),
    verificacao: rows.filter(r => r.status === 'verificacao'),
    encerrada:   rows.filter(r => r.status === 'encerrada'),
  }
}

/** Agrega NCs por origem para o gráfico de Pareto */
export async function getNCParetoData(): Promise<NCParetoItem[]> {
  const sb = createServiceClient()

  const { data } = await sb
    .from('nao_conformidades')
    .select('origem')

  const counts: Record<string, number> = {}
  for (const row of (data ?? []) as Array<{ origem: string }>) {
    const key = ORIGEM_LABEL[row.origem] ?? row.origem ?? 'Outros'
    counts[key] = (counts[key] ?? 0) + 1
  }

  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([categoria, total]) => ({ categoria, total }))

  const totalGeral = sorted.reduce((s, i) => s + i.total, 0)
  let acumulado = 0
  return sorted.map(({ categoria, total }) => {
    acumulado += total
    return {
      categoria,
      total,
      acumulado,
      percentualAcumulado: totalGeral > 0 ? Math.round((acumulado / totalGeral) * 100) : 0,
    }
  })
}

/** Busca KPIs básicos do painel NC */
export async function getNCKPIs() {
  const sb = createServiceClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [total, abertas, emTratamento, fechadasMes] = await Promise.all([
    sb.from('nao_conformidades').select('id', { count: 'exact', head: true }),
    sb.from('nao_conformidades').select('id', { count: 'exact', head: true }).eq('status', 'registrada'),
    sb.from('nao_conformidades').select('id', { count: 'exact', head: true }).in('status', ['em_analise', 'em_acao', 'verificacao']),
    sb.from('nao_conformidades').select('id', { count: 'exact', head: true }).eq('status', 'encerrada').gte('encerrada_em', thirtyDaysAgo),
  ])

  return {
    total:         total.count ?? 0,
    abertas:       abertas.count ?? 0,
    emTratamento:  emTratamento.count ?? 0,
    fechadasMes:   fechadasMes.count ?? 0,
  }
}

const ORIGEM_LABEL: Record<string, string> = {
  auditoria_interna: 'Auditoria Interna',
  auditoria_externa: 'Auditoria Externa',
  cliente:           'Reclamação Cliente',
  processo:          'Desvio de Processo',
  indicador:         'Indicador Fora da Meta',
}
