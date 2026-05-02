'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export interface ActionResult {
  ok: boolean
  id?: string
  error?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireAuth() {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) throw new Error('Não autenticado.')
  return user
}

function sb() {
  return createServiceClient() as any
}

// ── Unidades ──────────────────────────────────────────────────────────────────

export async function createUnidade(input: {
  nome: string
  codigo?: string
}): Promise<ActionResult> {
  try {
    await requireAuth()
    const { data, error } = await sb()
      .from('unidades')
      .insert({ nome: input.nome, codigo: input.codigo ?? null, ativa: true })
      .select('id')
      .single()
    if (error) return { ok: false, error: error.message }
    revalidatePath('/configuracoes/organizacao')
    return { ok: true, id: data.id }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function updateUnidade(
  id: string,
  input: { nome: string; codigo?: string; ativa: boolean }
): Promise<ActionResult> {
  try {
    await requireAuth()
    const { error } = await sb()
      .from('unidades')
      .update({ nome: input.nome, codigo: input.codigo ?? null, ativa: input.ativa })
      .eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/configuracoes/organizacao')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// ── Áreas ─────────────────────────────────────────────────────────────────────

export async function createArea(input: {
  nome: string
  unidadeId: string
}): Promise<ActionResult> {
  try {
    await requireAuth()
    const { data, error } = await sb()
      .from('areas')
      .insert({ nome: input.nome, unidade_id: input.unidadeId })
      .select('id')
      .single()
    if (error) return { ok: false, error: error.message }
    revalidatePath('/configuracoes/organizacao')
    return { ok: true, id: data.id }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function deleteArea(id: string): Promise<ActionResult> {
  try {
    await requireAuth()
    const { error } = await sb().from('areas').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/configuracoes/organizacao')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// ── Perfil de usuário ─────────────────────────────────────────────────────────

export async function updatePerfilUsuario(input: {
  nome: string
  avatarUrl?: string
}): Promise<ActionResult> {
  try {
    const user = await requireAuth()
    const { error } = await sb()
      .from('usuarios')
      .update({
        nome: input.nome,
        ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
      })
      .eq('id', user.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/configuracoes/perfil')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}
