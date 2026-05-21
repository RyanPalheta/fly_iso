import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { LntPrioridade, LntStatus } from '@/types/database'

export type LntRow = {
  id:                     string
  area_id:                string | null
  ano:                    number
  treinamento_nome:       string
  descricao:              string | null
  justificativa:          string | null
  prioridade:             LntPrioridade
  qtd_pessoas:            number
  carga_horaria_estimada: number | null
  status:                 LntStatus
  treinamento_id:         string | null
  created_at:             string
  area:                   { id: string; nome: string } | null
  criador:                { id: string; nome: string } | null
}

interface ListOpts {
  ano?:    number
  areaId?: string
  status?: LntStatus
}

export async function listLnt(opts: ListOpts = {}): Promise<LntRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  let q = sb
    .from('treinamento_lnt')
    .select(`
      id, area_id, ano, treinamento_nome, descricao, justificativa,
      prioridade, qtd_pessoas, carga_horaria_estimada, status, treinamento_id, created_at,
      area:areas!area_id ( id, nome ),
      criador:usuarios!criado_por ( id, nome )
    `)
    .order('ano', { ascending: false })
    .order('prioridade', { ascending: true })

  if (opts.ano)    q = q.eq('ano', opts.ano)
  if (opts.areaId) q = q.eq('area_id', opts.areaId)
  if (opts.status) q = q.eq('status', opts.status)

  const { data, error } = await q
  if (error) { console.error('[listLnt]', error.message); return [] }
  return (data ?? []) as LntRow[]
}
