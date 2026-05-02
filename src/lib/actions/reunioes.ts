'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ISO_INPUTS_9_3_2 } from '@/lib/queries/reunioes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sbService(): Promise<any> {
  return (await createServiceClient()) as any
}

export interface CreateReuniaoInput {
  titulo: string
  data: string
}

export interface ActionResult {
  ok: boolean
  id?: string
  error?: string
}

/** Cria uma nova reunião de análise crítica já com os 12 checklist items da ISO 9001:2015 cl. 9.3.2 */
export async function createReuniao(input: CreateReuniaoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user }, error: authErr } = await userSb.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()

  const { data, error } = await sb
    .from('reunioes')
    .insert({
      titulo:     input.titulo,
      data:       input.data,
      status:     'planejada',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: (error as { message: string }).message }

  const reuniaoId = (data as { id: string }).id

  // Cria os 12 checklist items automaticamente
  await sb.from('checklist_items').insert(
    ISO_INPUTS_9_3_2.map((item) => ({
      reuniao_id:  reuniaoId,
      item_iso:    item.item_iso,
      descricao:   item.descricao,
      status:      'pendente',
      ordem:       item.ordem,
    }))
  )

  revalidatePath('/analise-critica')
  return { ok: true, id: reuniaoId }
}

export async function updateReuniaoStatus(
  id: string,
  status: 'planejada' | 'em_andamento' | 'concluida'
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb.from('reunioes').update({ status }).eq('id', id)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath('/analise-critica')
  revalidatePath(`/analise-critica/${id}`)
  return { ok: true }
}

export async function updateChecklistItem(
  itemId: string,
  reuniaoId: string,
  updates: { status?: string; observacoes?: string }
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('checklist_items')
    .update(updates)
    .eq('id', itemId)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath(`/analise-critica/${reuniaoId}`)
  return { ok: true }
}

export async function createReuniaoAcao(
  reuniaoId: string,
  input: { descricao: string; responsavelId: string; prazo: string }
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { data, error } = await sb
    .from('reuniao_acoes')
    .insert({
      reuniao_id:     reuniaoId,
      descricao:      input.descricao,
      responsavel_id: input.responsavelId || null,
      prazo:          input.prazo || null,
      status:         'pendente',
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath(`/analise-critica/${reuniaoId}`)
  return { ok: true, id: (data as { id: string }).id }
}

export async function updateReuniaoAcaoStatus(
  acaoId: string,
  reuniaoId: string,
  status: 'pendente' | 'em_andamento' | 'concluida'
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('reuniao_acoes')
    .update({ status })
    .eq('id', acaoId)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath(`/analise-critica/${reuniaoId}`)
  return { ok: true }
}

export async function saveAta(reuniaoId: string, ata: string): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb.from('reunioes').update({ ata }).eq('id', reuniaoId)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath(`/analise-critica/${reuniaoId}`)
  return { ok: true }
}
