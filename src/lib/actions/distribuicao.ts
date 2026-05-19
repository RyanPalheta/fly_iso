'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { DistribuicaoTipo } from '@/lib/queries/distribuicao'

export interface ActionResult {
  ok:    boolean
  error?: string
  id?:    string
}

export interface DistribuirDocumentoInput {
  documentoId:    string
  versaoId?:      string | null
  tipo:           DistribuicaoTipo
  /** Para cada combinação unidade × areas, cria uma linha. */
  unidades:       Array<{
    unidadeId:   string
    areaIds:     string[]  // pode ser vazio → distribui pra unidade inteira
  }>
  numeroCopia?:   string   // só para copia_controlada
  destinatarioId?: string  // responsável pela cópia (opcional)
  observacao?:    string
}

export async function distribuirDocumento(input: DistribuirDocumentoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  if (input.unidades.length === 0) {
    return { ok: false, error: 'Selecione ao menos uma unidade.' }
  }
  if (input.tipo === 'copia_controlada' && !input.numeroCopia?.trim()) {
    return { ok: false, error: 'Número da cópia controlada é obrigatório.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  // Monta as linhas — uma por (unidade, area). Se areaIds vazio, cria 1 com area_id=null
  const rows: Array<Record<string, unknown>> = []
  for (const u of input.unidades) {
    if (u.areaIds.length === 0) {
      rows.push({
        documento_id:    input.documentoId,
        versao_id:       input.versaoId ?? null,
        tipo:            input.tipo,
        unidade_id:      u.unidadeId,
        area_id:         null,
        numero_copia:    input.numeroCopia?.trim() || null,
        destinatario_id: input.destinatarioId ?? null,
        observacao:      input.observacao?.trim() || null,
        distribuido_por: user.id,
      })
    } else {
      for (const areaId of u.areaIds) {
        rows.push({
          documento_id:    input.documentoId,
          versao_id:       input.versaoId ?? null,
          tipo:            input.tipo,
          unidade_id:      u.unidadeId,
          area_id:         areaId,
          numero_copia:    input.numeroCopia?.trim() || null,
          destinatario_id: input.destinatarioId ?? null,
          observacao:      input.observacao?.trim() || null,
          distribuido_por: user.id,
        })
      }
    }
  }

  const { error } = await sb.from('distribuicao_documento').insert(rows)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/documentos/${input.documentoId}`)
  return { ok: true }
}

export async function removerDistribuicao(input: {
  distribuicaoId: string
  documentoId:    string
}): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  const { error } = await sb
    .from('distribuicao_documento')
    .delete()
    .eq('id', input.distribuicaoId)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/documentos/${input.documentoId}`)
  return { ok: true }
}
