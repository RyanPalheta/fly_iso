'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sbService(): Promise<any> {
  return (await createServiceClient()) as any
}

export interface CreateTreinamentoInput {
  titulo: string
  descricao: string
  instrutor: string
  dataTreinamento: string
  validadeMeses: number
  areaId: string
  tipo: string
  documentoId: string
  participantesIds: string[]
}

export interface ActionResult {
  ok: boolean
  id?: string
  error?: string
}

export async function createTreinamento(input: CreateTreinamentoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user }, error: authErr } = await userSb.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { data, error } = await sb
    .from('treinamentos')
    .insert({
      titulo:           input.titulo,
      descricao:        input.descricao || null,
      instrutor:        input.instrutor || null,
      data_treinamento: input.dataTreinamento || null,
      validade_meses:   input.validadeMeses || null,
      area_id:          input.areaId || null,
      tipo:             input.tipo,
      documento_id:     input.documentoId || null,
      status:           'planejado',
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: (error as { message: string }).message }

  const treinamentoId = (data as { id: string }).id

  // Adiciona participantes
  if (input.participantesIds.length > 0) {
    await sb.from('treinamento_participantes').insert(
      input.participantesIds.map((uid) => ({
        treinamento_id: treinamentoId,
        usuario_id:     uid,
        status:         'pendente',
      }))
    )
  }

  revalidatePath('/treinamentos')
  return { ok: true, id: treinamentoId }
}

export async function updateTreinamentoStatus(
  id: string,
  status: 'planejado' | 'realizado' | 'cancelado'
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb.from('treinamentos').update({ status }).eq('id', id)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath('/treinamentos')
  revalidatePath(`/treinamentos/${id}`)
  return { ok: true }
}

export async function updateParticipanteStatus(
  participanteId: string,
  treinamentoId: string,
  status: 'pendente' | 'concluido' | 'ausente'
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('treinamento_participantes')
    .update({ status })
    .eq('id', participanteId)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath(`/treinamentos/${treinamentoId}`)
  return { ok: true }
}

export async function registrarAceiteDigital(
  participanteId: string,
  treinamentoId: string
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('treinamento_participantes')
    .update({ aceite_digital: true, aceite_em: new Date().toISOString(), status: 'concluido' })
    .eq('id', participanteId)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath(`/treinamentos/${treinamentoId}`)
  return { ok: true }
}
