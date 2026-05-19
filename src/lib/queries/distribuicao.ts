import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

export type DistribuicaoTipo = 'eletronica' | 'copia_controlada'

export type DistribuicaoRow = {
  id:                string
  documento_id:      string
  versao_id:         string | null
  tipo:              DistribuicaoTipo
  unidade_id:        string | null
  area_id:           string | null
  numero_copia:      string | null
  data_distribuicao: string
  observacao:        string | null
  created_at:        string
  unidade:           { id: string; nome: string; codigo: string | null } | null
  area:              { id: string; nome: string } | null
  destinatario:      { id: string; nome: string } | null
  distribuidor:      { id: string; nome: string } | null
}

/** Lista distribuições de um documento, mais recente primeiro. */
export async function listDistribuicoesDocumento(documentoId: string): Promise<DistribuicaoRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  const { data, error } = await sb
    .from('distribuicao_documento')
    .select(`
      id, documento_id, versao_id, tipo, unidade_id, area_id,
      numero_copia, data_distribuicao, observacao, created_at,
      unidade:unidades!unidade_id ( id, nome, codigo ),
      area:areas!area_id ( id, nome ),
      destinatario:usuarios!destinatario_id ( id, nome ),
      distribuidor:usuarios!distribuido_por ( id, nome )
    `)
    .eq('documento_id', documentoId)
    .order('created_at', { ascending: false })

  if (error) { console.error('[listDistribuicoesDocumento]', error.message); return [] }
  return (data ?? []) as DistribuicaoRow[]
}
