'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sbService(): Promise<any> {
  return (await createServiceClient()) as any
}

export interface CreateRegistroInput {
  titulo: string
  tipo: string
  areaId: string
  responsavelId: string
  dataCriacao: string
}

export interface ActionResult {
  ok: boolean
  id?: string
  error?: string
}

export async function createRegistro(input: CreateRegistroInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user }, error: authErr } = await userSb.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { data, error } = await sb
    .from('registros')
    .insert({
      titulo:         input.titulo,
      tipo:           input.tipo || null,
      area_id:        input.areaId || null,
      responsavel_id: input.responsavelId || null,
      data_criacao:   input.dataCriacao || null,
      status:         'ativo',
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath('/registros')
  return { ok: true, id: (data as { id: string }).id }
}

export async function updateRegistroStatus(
  id: string,
  status: 'ativo' | 'arquivado' | 'descartado'
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('registros')
    .update({
      status,
      ...(status === 'arquivado' ? { data_arquivamento: new Date().toISOString().split('T')[0] } : {}),
      ...(status === 'descartado' ? { data_descarte: new Date().toISOString().split('T')[0] } : {}),
    })
    .eq('id', id)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath('/registros')
  return { ok: true }
}
