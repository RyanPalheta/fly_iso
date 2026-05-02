import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type TreinamentoRow = {
  id: string
  documento_id: string | null
  titulo: string
  descricao: string | null
  instrutor: string | null
  data_treinamento: string | null
  validade_meses: number | null
  area_id: string | null
  tipo: string
  status: string
  evidencia_url: string | null
  created_at: string
  updated_at: string
}

export type ParticipanteRow = {
  id: string
  treinamento_id: string
  usuario_id: string | null
  status: string
  certificado_url: string | null
  aceite_digital: boolean
  aceite_em: string | null
  created_at: string
}

export type TreinamentoComRelacoes = TreinamentoRow & {
  areas: { nome: string; unidades: { nome: string } | null } | null
  documento: { titulo: string; codigo: string | null } | null
  treinamento_participantes: Array<ParticipanteRow & {
    usuario: { id: string; nome: string } | null
  }>
}

export type TreinamentoStats = {
  total: number
  planejados: number
  realizados: number
  cancelados: number
  taxa_conclusao: number   // % participantes com status concluido
}

export async function listTreinamentos(): Promise<TreinamentoComRelacoes[]> {
  const sb = await createClient()

  const { data, error } = await (sb as any)
    .from('treinamentos')
    .select(`
      *,
      areas ( nome, unidades ( nome ) ),
      documento:documentos!documento_id ( titulo, codigo ),
      treinamento_participantes (
        *,
        usuario:usuarios!usuario_id ( id, nome )
      )
    `)
    .order('data_treinamento', { ascending: false })

  if (error) { console.error('listTreinamentos', error); return [] }
  return (data ?? []) as TreinamentoComRelacoes[]
}

export async function getTreinamento(id: string): Promise<TreinamentoComRelacoes | null> {
  const sb = await createClient()

  const { data, error } = await (sb as any)
    .from('treinamentos')
    .select(`
      *,
      areas ( nome, unidades ( nome ) ),
      documento:documentos!documento_id ( titulo, codigo ),
      treinamento_participantes (
        *,
        usuario:usuarios!usuario_id ( id, nome )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as TreinamentoComRelacoes
}

export async function getTreinamentoStats(): Promise<TreinamentoStats> {
  const sb = await createClient()

  const { data } = await (sb as any)
    .from('treinamentos')
    .select('status')

  const rows = (data ?? []) as Array<{ status: string }>
  const total    = rows.length
  const planejados  = rows.filter((r) => r.status === 'planejado').length
  const realizados  = rows.filter((r) => r.status === 'realizado').length
  const cancelados  = rows.filter((r) => r.status === 'cancelado').length

  // Taxa de conclusão de participantes
  const { data: partic } = await (sb as any)
    .from('treinamento_participantes')
    .select('status')

  const ps = (partic ?? []) as Array<{ status: string }>
  const totalP   = ps.length
  const concluidosP = ps.filter((p) => p.status === 'concluido').length
  const taxaConclusao = totalP > 0 ? Math.round((concluidosP / totalP) * 100) : 0

  return { total, planejados, realizados, cancelados, taxa_conclusao: taxaConclusao }
}
