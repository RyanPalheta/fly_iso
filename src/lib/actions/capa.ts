'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { CapaStatus } from '@/types/database'

export interface CreateCapaInput {
  ncId: string
  tipo: 'corretiva' | 'preventiva'
  descricao: string
  responsavelId: string
  prazoGeral: string
}

export interface SaveCincoPortquesInput {
  capaId: string
  porques: Array<{ ordem: number; porque: string; resposta: string }>
}

export interface CreateAcaoInput {
  capaId: string
  descricao: string
  responsavelId: string
  prazo: string
}

export interface ActionResult {
  ok: boolean
  id?: string
  error?: string
}

// Todas as mutações usam service client (bypassa RLS — seguro pois roda
// só no servidor e autenticação é verificada via createClient().auth.getUser())
async function sbService() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createServiceClient()) as any
}

async function gerarCodigoCapa(): Promise<string> {
  const sb = await sbService()
  const { data } = await sb
    .from('capas')
    .select('codigo')
    .order('created_at', { ascending: false })
    .limit(50)

  let max = 0
  for (const row of (data ?? []) as Array<{ codigo: string }>) {
    const m = row.codigo?.match(/CAPA-(\d+)/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `CAPA-${String(max + 1).padStart(3, '0')}`
}

export async function createCapa(input: CreateCapaInput): Promise<ActionResult> {
  // 1. Verifica autenticação com client do usuário
  const userSb = await createClient()
  const { data: { user }, error: authErr } = await userSb.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Não autenticado.' }

  const codigo = await gerarCodigoCapa()
  const sb = await sbService()

  const { data, error } = await sb
    .from('capas')
    .insert({
      codigo,
      nc_id:             input.ncId,
      tipo:              input.tipo,
      descricao:         input.descricao,
      responsavel_id:    input.responsavelId,
      prazo_geral:       input.prazoGeral,
      status:            'aberta',
      causa_raiz_metodo: '5_porques',
      causa_raiz_dados:  { porques: [] },
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: (error as { message: string }).message }

  // Atualiza NC vinculada → em_acao
  await sb.from('nao_conformidades').update({ status: 'em_acao' }).eq('id', input.ncId)

  revalidatePath('/capa')
  revalidatePath(`/nao-conformidades/${input.ncId}`)
  return { ok: true, id: (data as { id: string }).id }
}

export async function saveCincoPortques(input: SaveCincoPortquesInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('capas')
    .update({ causa_raiz_metodo: '5_porques', causa_raiz_dados: { porques: input.porques } })
    .eq('id', input.capaId)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath(`/capa/${input.capaId}`)
  return { ok: true }
}

export async function createAcao(input: CreateAcaoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { data, error } = await sb
    .from('acoes')
    .insert({
      capa_id:        input.capaId,
      descricao:      input.descricao,
      responsavel_id: input.responsavelId,
      prazo:          input.prazo,
      status:         'pendente',
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath(`/capa/${input.capaId}`)
  return { ok: true, id: (data as { id: string }).id }
}

export async function updateAcaoStatus(
  acaoId: string,
  capaId: string,
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('acoes')
    .update({ status, ...(status === 'concluida' ? { concluida_em: new Date().toISOString() } : {}) })
    .eq('id', acaoId)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath(`/capa/${capaId}`)
  return { ok: true }
}

export async function updateCapaStatus(capaId: string, status: CapaStatus): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('capas')
    .update({ status, ...(status === 'encerrada' ? { encerrada_em: new Date().toISOString() } : {}) })
    .eq('id', capaId)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath('/capa')
  revalidatePath(`/capa/${capaId}`)
  return { ok: true }
}
