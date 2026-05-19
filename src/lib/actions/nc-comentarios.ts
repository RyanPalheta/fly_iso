'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export interface ComentarioResult {
  ok:     boolean
  error?: string
  id?:    string
}

export async function criarComentarioNC(input: {
  ncId:  string
  texto: string
}): Promise<ComentarioResult> {
  if (!input.texto.trim()) return { ok: false, error: 'O comentário não pode estar vazio.' }
  if (input.texto.length > 2000) return { ok: false, error: 'Limite de 2000 caracteres.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userSb = (await createClient()) as any
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  const { data, error } = await sb
    .from('nc_comentarios')
    .insert({
      nc_id:      input.ncId,
      usuario_id: user.id,
      texto:      input.texto.trim(),
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/nao-conformidades/${input.ncId}`)
  return { ok: true, id: (data as { id: string }).id }
}

export async function deletarComentarioNC(comentarioId: string, ncId: string): Promise<ComentarioResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userSb = (await createClient()) as any
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  // RLS já garante que só o autor consegue deletar
  const { error } = await userSb
    .from('nc_comentarios')
    .delete()
    .eq('id', comentarioId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/nao-conformidades/${ncId}`)
  return { ok: true }
}

export async function editarComentarioNC(input: {
  comentarioId: string
  ncId:         string
  texto:        string
}): Promise<ComentarioResult> {
  if (!input.texto.trim()) return { ok: false, error: 'O comentário não pode estar vazio.' }
  if (input.texto.length > 2000) return { ok: false, error: 'Limite de 2000 caracteres.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userSb = (await createClient()) as any
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { error } = await userSb
    .from('nc_comentarios')
    .update({
      texto:      input.texto.trim(),
      editado:    true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.comentarioId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/nao-conformidades/${input.ncId}`)
  return { ok: true }
}
