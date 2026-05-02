'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sbService(): Promise<any> {
  return (await createServiceClient()) as any
}

export interface ActionResult {
  ok: boolean
  id?: string
  error?: string
}

export async function updateUsuarioPerfil(
  userId: string,
  perfilId: string
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb.from('usuarios').update({ perfil_id: perfilId }).eq('id', userId)
  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath('/usuarios')
  return { ok: true }
}

export async function toggleUsuarioAtivo(userId: string, ativo: boolean): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb.from('usuarios').update({ ativo }).eq('id', userId)
  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath('/usuarios')
  return { ok: true }
}
