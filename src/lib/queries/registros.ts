import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type RegistroRow = {
  id: string
  titulo: string
  tipo: string | null
  politica_id: string | null
  documento_id: string | null
  area_id: string | null
  responsavel_id: string | null
  arquivo_url: string | null
  status: string
  data_criacao: string | null
  data_arquivamento: string | null
  data_descarte: string | null
  created_at: string
  updated_at: string
}

export type RegistroComRelacoes = RegistroRow & {
  areas: { nome: string } | null
  responsavel: { nome: string } | null
}

export async function listRegistros(): Promise<RegistroComRelacoes[]> {
  const sb = await createClient()
  const { data, error } = await (sb as any)
    .from('registros')
    .select(`
      *,
      areas ( nome ),
      responsavel:usuarios!responsavel_id ( nome )
    `)
    .order('created_at', { ascending: false })

  if (error) { console.error('listRegistros', error); return [] }
  return (data ?? []) as RegistroComRelacoes[]
}

export async function getRegistro(id: string): Promise<RegistroComRelacoes | null> {
  const sb = await createClient()
  const { data, error } = await (sb as any)
    .from('registros')
    .select(`
      *,
      areas ( nome ),
      responsavel:usuarios!responsavel_id ( nome )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as RegistroComRelacoes
}

export type RegistroStats = {
  total: number
  ativos: number
  arquivados: number
  descartados: number
}

export async function getRegistroStats(): Promise<RegistroStats> {
  const sb = await createClient()
  const { data } = await (sb as any).from('registros').select('status')
  const rows = (data ?? []) as Array<{ status: string }>
  return {
    total:       rows.length,
    ativos:      rows.filter((r) => r.status === 'ativo').length,
    arquivados:  rows.filter((r) => r.status === 'arquivado').length,
    descartados: rows.filter((r) => r.status === 'descartado').length,
  }
}
