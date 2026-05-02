import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { CapaStatus } from '@/types/database'

export type CapaComRelacoes = {
  id: string
  codigo: string
  tipo: 'corretiva' | 'preventiva'
  descricao: string | null
  status: CapaStatus
  prazo_geral: string | null
  causa_raiz_metodo: string | null
  causa_raiz_dados: unknown
  created_at: string
  updated_at: string
  encerrada_em: string | null
  nc: { id: string; codigo: string; titulo: string; severidade: string | null } | null
  responsavel: { id: string; nome: string; email: string } | null
  area: { id: string; nome: string } | null
}

export type AcaoComResponsavel = {
  id: string
  capa_id: string | null
  descricao: string
  prazo: string | null
  status: string
  evidencia_urls: unknown
  concluida_em: string | null
  created_at: string
  responsavel: { id: string; nome: string } | null
}

export interface CapaStats {
  total: number
  abertas: number
  emExecucao: number
  encerradas: number
  vencidas: number
}

export async function listCapas(): Promise<CapaComRelacoes[]> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('capas')
    .select(`
      id, codigo, tipo, descricao, status, prazo_geral,
      causa_raiz_metodo, causa_raiz_dados,
      created_at, updated_at, encerrada_em,
      nc:nao_conformidades!capas_nc_id_fkey ( id, codigo, titulo, severidade ),
      responsavel:usuarios!capas_responsavel_id_fkey ( id, nome, email )
    `)
    .order('created_at', { ascending: false })
    .returns<CapaComRelacoes[]>()

  if (error) throw new Error(`Erro ao listar CAPAs: ${error.message}`)
  return data ?? []
}

export async function getCapa(id: string): Promise<CapaComRelacoes | null> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('capas')
    .select(`
      id, codigo, tipo, descricao, status, prazo_geral,
      causa_raiz_metodo, causa_raiz_dados,
      created_at, updated_at, encerrada_em,
      nc:nao_conformidades!capas_nc_id_fkey ( id, codigo, titulo, severidade ),
      responsavel:usuarios!capas_responsavel_id_fkey ( id, nome, email )
    `)
    .eq('id', id)
    .returns<CapaComRelacoes[]>()
    .maybeSingle()

  if (error) throw new Error(`Erro ao buscar CAPA ${id}: ${error.message}`)
  return data ?? null
}

export async function getAcoes(capaId: string): Promise<AcaoComResponsavel[]> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('acoes')
    .select(`
      id, capa_id, descricao, prazo, status,
      evidencia_urls, concluida_em, created_at,
      responsavel:usuarios!acoes_responsavel_id_fkey ( id, nome )
    `)
    .eq('capa_id', capaId)
    .order('created_at', { ascending: true })
    .returns<AcaoComResponsavel[]>()

  if (error) throw new Error(`Erro ao buscar ações: ${error.message}`)
  return data ?? []
}

export async function getCapaStats(): Promise<CapaStats> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('capas')
    .select('status, prazo_geral')
    .returns<Array<{ status: CapaStatus; prazo_geral: string | null }>>()

  if (error) throw new Error(`Erro ao agregar CAPAs: ${error.message}`)

  const hoje = new Date().toISOString().split('T')[0]
  const stats: CapaStats = { total: 0, abertas: 0, emExecucao: 0, encerradas: 0, vencidas: 0 }

  for (const row of data ?? []) {
    stats.total++
    if (row.status === 'encerrada') {
      stats.encerradas++
    } else {
      if (row.status === 'aberta' || row.status === 'em_investigacao') stats.abertas++
      else stats.emExecucao++
      if (row.prazo_geral && row.prazo_geral < hoje) stats.vencidas++
    }
  }
  return stats
}
