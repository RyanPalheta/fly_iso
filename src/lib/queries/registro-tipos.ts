import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { RegistroCampoDef, RegistroDescarteAcao } from '@/types/database'

export interface RegistroTipoRow {
  id:             string
  codigo:         string
  nome:           string
  descricao:      string | null
  campos:         RegistroCampoDef[]
  retencao_meses: number
  descarte_acao:  RegistroDescarteAcao
  ativo:          boolean
  created_at:     string
  updated_at:     string
}

export async function listRegistroTipos(opts: { somenteAtivos?: boolean } = {}): Promise<RegistroTipoRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  let q = sb.from('registro_tipos').select('*').order('nome')
  if (opts.somenteAtivos) q = q.eq('ativo', true)
  const { data, error } = await q
  if (error) { console.error('[listRegistroTipos]', error.message); return [] }
  return (data ?? []) as RegistroTipoRow[]
}

export async function getRegistroTipo(id: string): Promise<RegistroTipoRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  const { data, error } = await sb
    .from('registro_tipos').select('*').eq('id', id).maybeSingle()
  if (error) { console.error('[getRegistroTipo]', error.message); return null }
  return (data as RegistroTipoRow | null) ?? null
}
