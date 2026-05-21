'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notificarRetreinamento } from '@/lib/actions/treinamentos'
import type { DocumentoStatus, DocumentoTipo } from '@/types/database'

export interface ActionResult {
  ok:    boolean
  id?:   string
  error?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sbService(): Promise<any> {
  return createServiceClient() as any
}

/** Gera próximo código DOC-XXX baseado no maior existente. */
async function gerarCodigoDocumento(): Promise<string> {
  const sb = await sbService()
  const { data } = await sb
    .from('documentos')
    .select('codigo')
    .order('created_at', { ascending: false })
    .limit(100)

  let max = 0
  for (const row of (data ?? []) as Array<{ codigo: string }>) {
    const m = row.codigo?.match(/DOC-(\d+)/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `DOC-${String(max + 1).padStart(3, '0')}`
}

export interface CreateDocumentoInput {
  titulo:         string
  tipo:           DocumentoTipo
  descricao?:     string
  areaId:         string
  responsavelId:  string
  tags?:          string[]
}

/** Cria documento + versão inicial (v0, sem arquivo). */
export async function createDocumento(input: CreateDocumentoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  if (!input.titulo.trim()) return { ok: false, error: 'Título obrigatório.' }
  if (!input.areaId)        return { ok: false, error: 'Área obrigatória.' }
  if (!input.responsavelId) return { ok: false, error: 'Responsável obrigatório.' }

  const codigo = await gerarCodigoDocumento()
  const sb = await sbService()

  const { data: doc, error: docErr } = await sb
    .from('documentos')
    .insert({
      codigo,
      titulo:         input.titulo.trim(),
      tipo:           input.tipo,
      descricao:      input.descricao?.trim() || null,
      area_id:        input.areaId,
      responsavel_id: input.responsavelId,
      tags:           input.tags && input.tags.length > 0 ? input.tags : null,
      status:         'rascunho',
      revisao_atual:  0,
    })
    .select('id')
    .single()

  if (docErr) return { ok: false, error: docErr.message }

  // Cria versão inicial v0 (sem arquivo — usuário fará upload depois)
  await sb.from('versoes').insert({
    documento_id:        (doc as { id: string }).id,
    numero_revisao:      0,
    descricao_alteracao: 'Versão inicial — criação do documento.',
    criado_por:          user.id,
    status:              'pendente',
  })

  revalidatePath('/documentos')
  return { ok: true, id: (doc as { id: string }).id }
}

export interface UpdateDocumentoInput {
  id:       string
  titulo:   string
  descricao?: string
  tipo?:    string
  status?:  DocumentoStatus
}

/** Atualiza metadados do documento (titulo, descrição, tipo, status). */
export async function updateDocumento(input: UpdateDocumentoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  if (!input.titulo.trim()) return { ok: false, error: 'Título obrigatório.' }

  const sb = await sbService()
  const { error } = await sb
    .from('documentos')
    .update({
      titulo:    input.titulo.trim(),
      descricao: input.descricao?.trim() || null,
      tipo:      input.tipo ?? null,
      ...(input.status ? { status: input.status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/documentos')
  revalidatePath(`/documentos/${input.id}`)
  return { ok: true }
}

export interface CreateVersaoInput {
  documentoId:        string
  arquivoUrl:         string
  arquivoNome:        string
  descricaoAlteracao: string  // OBRIGATÓRIO — requisito ISO
}

/**
 * Cria uma NOVA versão do documento.
 *  - Incrementa numero_revisao (maior atual + 1)
 *  - Exige descricao_alteracao (requisito normativo)
 *  - Atualiza documentos.revisao_atual + updated_at
 *  - Coloca o documento em "em_revisao" para nova aprovação
 */
export async function createVersao(input: CreateVersaoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  if (!input.descricaoAlteracao?.trim()) {
    return { ok: false, error: 'Descrição das alterações é obrigatória (requisito ISO).' }
  }
  if (!input.arquivoUrl || !input.arquivoNome) {
    return { ok: false, error: 'Faça upload do arquivo antes de criar a versão.' }
  }

  const sb = await sbService()

  // 1) Descobre maior revisão atual
  const { data: ultimaVersao } = await sb
    .from('versoes')
    .select('numero_revisao')
    .eq('documento_id', input.documentoId)
    .order('numero_revisao', { ascending: false })
    .limit(1)
    .maybeSingle()

  const proxima = ((ultimaVersao as { numero_revisao: number } | null)?.numero_revisao ?? -1) + 1

  // 2) Insere nova versão
  const { data: versao, error: versaoErr } = await sb
    .from('versoes')
    .insert({
      documento_id:        input.documentoId,
      numero_revisao:      proxima,
      arquivo_url:         input.arquivoUrl,
      arquivo_nome:        input.arquivoNome,
      descricao_alteracao: input.descricaoAlteracao.trim(),
      criado_por:          user.id,
      status:              'pendente',
    })
    .select('id')
    .single()

  if (versaoErr) return { ok: false, error: versaoErr.message }

  // 3) Atualiza documento: revisao_atual + status → em_revisao
  const { error: docErr } = await sb
    .from('documentos')
    .update({
      revisao_atual: proxima,
      status:        'em_revisao',
      updated_at:    new Date().toISOString(),
    })
    .eq('id', input.documentoId)

  if (docErr) return { ok: false, error: docErr.message }

  // ── Trigger de retreinamento (auditor — Fase C) ──
  // Notifica todos os participantes de treinamentos internos vinculados a este doc
  try {
    await notificarRetreinamento(input.documentoId, proxima)
  } catch (e) {
    console.error('[createVersao] notificarRetreinamento falhou:', e)
    // Não bloqueia o fluxo principal — só loga
  }

  revalidatePath(`/documentos/${input.documentoId}`)
  revalidatePath('/documentos')
  return { ok: true, id: (versao as { id: string }).id }
}
