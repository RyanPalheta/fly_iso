import 'server-only'
import { createClient } from '@/lib/supabase/server'
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

export async function listRegistros(opts: ListOpts = {}): Promise<RegistroComRelacoes[]> {
  const sb = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (sb as any)
    .from('registros')
    .select(`
      *,
      areas ( nome ),
      responsavel:usuarios!responsavel_id ( nome ),
      tipo_def:registro_tipos!tipo_id ( id, codigo, nome, campos )
    `)
    .order('created_at', { ascending: false })

  if (opts.tipoId) q = q.eq('tipo_id', opts.tipoId)
  if (opts.status) q = q.eq('status', opts.status)
  if (opts.vencidos) {
    const hoje = new Date().toISOString().split('T')[0]
    q = q.lt('prazo_descarte', hoje).is('arquivado_em', null)
  }

  const { data, error } = await q
  if (error) { console.error('listRegistros', error); return [] }
  return (data ?? []) as RegistroComRelacoes[]
}

export async function getRegistro(id: string): Promise<RegistroComRelacoes | null> {
  const sb = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb as any)
    .from('registros')
    .select(`
      *,
      areas ( nome ),
      responsavel:usuarios!responsavel_id ( nome ),
      tipo_def:registro_tipos!tipo_id ( id, codigo, nome, campos )
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
  vencidos: number   // ativos com prazo_descarte vencido
}

export async function getRegistroStats(): Promise<RegistroStats> {
  const sb = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (sb as any).from('registros').select('status, prazo_descarte, arquivado_em')
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
