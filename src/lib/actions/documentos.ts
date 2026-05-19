'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { DocumentoStatus } from '@/types/database'

export interface ActionResult {
  ok:    boolean
  id?:   string
  error?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sbService(): Promise<any> {
  return createServiceClient() as any
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

  revalidatePath(`/documentos/${input.documentoId}`)
  revalidatePath('/documentos')
  return { ok: true, id: (versao as { id: string }).id }
}
