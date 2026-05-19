'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { NCSeveridade, NCOrigem, NCTipoAcao } from '@/types/database'

export interface CreateNCInput {
  titulo: string
  descricao: string
  analiseImpacto: string
  clausulaIso: string
  gravidade: NCSeveridade
  areaId: string
  responsavelId: string
  origem: NCOrigem
  tipoAcao: NCTipoAcao
  acaoImediata?: string
}

export interface ActionResult {
  ok: boolean
  id?: string
  error?: string
}

// Mutações usam service client (bypassa RLS) — auth verificada com createClient()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sbService(): Promise<any> {
  return (await createServiceClient()) as any
}

/** Gera o próximo código NC-XXX baseado no maior código existente. */
async function gerarCodigoNC(): Promise<string> {
  const sb = await sbService()
  const { data } = await sb
    .from('nao_conformidades')
    .select('codigo')
    .order('created_at', { ascending: false })
    .limit(50)

  let max = 0
  for (const row of (data ?? []) as Array<{ codigo: string }>) {
    const m = row.codigo?.match(/NC-(\d+)/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `NC-${String(max + 1).padStart(3, '0')}`
}

export async function createNC(input: CreateNCInput): Promise<ActionResult> {
  // 1. Verifica autenticação com client do usuário
  const userSb = await createClient()
  const { data: { user }, error: authErr } = await userSb.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Não autenticado.' }

  const codigo = await gerarCodigoNC()
  const descricaoCompleta = input.analiseImpacto
    ? `${input.descricao}\n\nAnálise de Impacto:\n${input.analiseImpacto}`
    : input.descricao

  const sb = await sbService()
  const { data, error } = await sb
    .from('nao_conformidades')
    .insert({
      codigo,
      titulo:            input.titulo || input.descricao.slice(0, 80),
      descricao:         descricaoCompleta,
      severidade:        input.gravidade,
      origem:            input.origem,
      area_id:           input.areaId,
      responsavel_id:    input.responsavelId,
      detectado_por:     user.id,
      requisito_violado: input.clausulaIso,
      status:            'registrada',
      tipo_acao:         input.tipoAcao,
      acao_imediata:     input.acaoImediata ?? null,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: (error as { message: string }).message }

  revalidatePath('/nao-conformidades')
  return { ok: true, id: (data as { id: string }).id }
}

export async function updateNCStatus(
  id: string,
  status: 'registrada' | 'em_analise' | 'em_acao' | 'verificacao' | 'encerrada'
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('nao_conformidades')
    .update({
      status,
      ...(status === 'encerrada' ? { encerrada_em: new Date().toISOString() } : {}),
    })
    .eq('id', id)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath('/nao-conformidades')
  revalidatePath(`/nao-conformidades/${id}`)
  return { ok: true }
}
