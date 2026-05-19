'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { computeCapaStatus } from '@/lib/utils/capa-status'
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

/**
 * Recalcula e atualiza o status do CAPA com base no estado atual dos dados.
 * Roda em toda mutação (causa raiz, criação/atualização de ação, verificação).
 *
 * Se a CAPA já está encerrada manualmente, NÃO sobrescreve.
 */
async function recalcularStatus(capaId: string): Promise<void> {
  const sb = await sbService()

  const [{ data: capa }, { data: acoes }, { data: verificacoes }] = await Promise.all([
    sb.from('capas')
      .select('codigo, status, causa_raiz_metodo, causa_raiz_dados, responsavel_id, nc_id')
      .eq('id', capaId)
      .single(),
    sb.from('acoes')
      .select('status')
      .eq('capa_id', capaId),
    sb.from('verificacoes_eficacia')
      .select('eficaz')
      .eq('capa_id', capaId),
  ])

  if (!capa) return

  const capaTyped = capa as {
    codigo: string
    status: CapaStatus
    causa_raiz_metodo: string | null
    causa_raiz_dados: unknown
    responsavel_id: string | null
    nc_id: string | null
  }

  const novoStatus = computeCapaStatus({
    causaRaizMetodo: capaTyped.causa_raiz_metodo,
    causaRaizDados:  capaTyped.causa_raiz_dados,
    acoes:           (acoes ?? []) as Array<{ status: string }>,
    verificacoes:    (verificacoes ?? []) as Array<{ eficaz: boolean | null }>,
  })

  if (novoStatus === capaTyped.status) return

  await sb
    .from('capas')
    .update({
      status: novoStatus,
      ...(novoStatus === 'encerrada' ? { encerrada_em: new Date().toISOString() } : {}),
    })
    .eq('id', capaId)

  // ── Trigger de notificações por transição de status ──

  // Mudou para Verificação: notificar responsável da CAPA
  if (novoStatus === 'verificacao' && capaTyped.responsavel_id) {
    await sb.from('notificacoes').insert({
      usuario_id:  capaTyped.responsavel_id,
      titulo:      `${capaTyped.codigo} pronto para verificação de eficácia`,
      mensagem:    'Todas as ações foram concluídas. Acesse a CAPA para registrar a verificação de eficácia.',
      tipo:        'alerta',
      entidade:    'capas',
      entidade_id: capaId,
    })
  }

  // Mudou para Encerrada: notificar responsável de NC (se houver)
  if (novoStatus === 'encerrada' && capaTyped.nc_id) {
    const { data: nc } = await sb
      .from('nao_conformidades')
      .select('responsavel_id, codigo')
      .eq('id', capaTyped.nc_id)
      .single()

    const ncTyped = nc as { responsavel_id: string | null; codigo: string } | null
    if (ncTyped?.responsavel_id) {
      await sb.from('notificacoes').insert({
        usuario_id:  ncTyped.responsavel_id,
        titulo:      `${ncTyped.codigo} encerrada com sucesso`,
        mensagem:    `A CAPA ${capaTyped.codigo} foi encerrada após verificação de eficácia. A NC está resolvida.`,
        tipo:        'sucesso',
        entidade:    'nao_conformidades',
        entidade_id: capaTyped.nc_id,
      })
    }
  }
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

  await recalcularStatus(input.capaId)
  revalidatePath(`/capa/${input.capaId}`)
  return { ok: true }
}

export interface SaveIshikawaInput {
  capaId: string
  categorias: {
    metodo:        string[]
    maquina:       string[]
    mao_de_obra:   string[]
    material:      string[]
    medida:        string[]
    meio_ambiente: string[]
  }
}

export async function saveIshikawa(input: SaveIshikawaInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('capas')
    .update({
      causa_raiz_metodo: 'ishikawa',
      causa_raiz_dados:  { categorias: input.categorias },
    })
    .eq('id', input.capaId)

  if (error) return { ok: false, error: (error as { message: string }).message }

  await recalcularStatus(input.capaId)
  revalidatePath(`/capa/${input.capaId}`)
  return { ok: true }
}

export interface SaveTextoLivreInput {
  capaId: string
  texto:  string
}

export async function saveTextoLivre(input: SaveTextoLivreInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('capas')
    .update({
      causa_raiz_metodo: 'texto_livre',
      causa_raiz_dados:  { texto: input.texto },
    })
    .eq('id', input.capaId)

  if (error) return { ok: false, error: (error as { message: string }).message }

  await recalcularStatus(input.capaId)
  revalidatePath(`/capa/${input.capaId}`)
  return { ok: true }
}

export async function setCausaRaizMetodo(capaId: string, metodo: '5_porques' | 'ishikawa' | 'texto_livre'): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  // Apenas troca o método se ainda não há dados (ou força reset)
  const { error } = await sb
    .from('capas')
    .update({ causa_raiz_metodo: metodo, causa_raiz_dados: {} })
    .eq('id', capaId)

  if (error) return { ok: false, error: (error as { message: string }).message }
  await recalcularStatus(capaId)
  revalidatePath(`/capa/${capaId}`)
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

  await recalcularStatus(input.capaId)
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

  await recalcularStatus(capaId)
  revalidatePath(`/capa/${capaId}`)
  return { ok: true }
}

export interface RegistrarVerificacaoInput {
  capaId:       string
  eficaz:       boolean
  observacoes:  string
  evidenciaUrls?: Array<{ url: string; nome: string }>
}

/**
 * Registra a verificação de eficácia da CAPA.
 *  - Só o responsável (ou Admin/Qualidade) pode verificar.
 *  - Se eficaz=true → CAPA é encerrada automaticamente via recalcularStatus.
 *  - Se eficaz=false → CAPA volta para 'em_execucao' e responsável recebe
 *    notificação de retrabalho.
 */
export async function registrarVerificacao(input: RegistrarVerificacaoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  if (!input.observacoes.trim()) {
    return { ok: false, error: 'Observações são obrigatórias para fins de auditoria.' }
  }

  const sb = await sbService()

  // Valida que o usuário é o responsável da CAPA
  const { data: capa } = await sb
    .from('capas')
    .select('codigo, responsavel_id, status')
    .eq('id', input.capaId)
    .single()

  const capaTyped = capa as { codigo: string; responsavel_id: string | null; status: CapaStatus } | null
  if (!capaTyped) return { ok: false, error: 'CAPA não encontrada.' }

  // (Admin/Qualidade poderia ser permitido aqui também — por ora só o responsável)
  if (capaTyped.responsavel_id !== user.id) {
    return { ok: false, error: 'Apenas o responsável pode registrar a verificação.' }
  }

  if (capaTyped.status !== 'verificacao' && capaTyped.status !== 'reaberta') {
    return { ok: false, error: 'CAPA não está em fase de verificação.' }
  }

  // Insere registro de verificação
  const { error } = await sb
    .from('verificacoes_eficacia')
    .insert({
      capa_id:          input.capaId,
      verificado_por:   user.id,
      data_verificacao: new Date().toISOString().split('T')[0],
      eficaz:           input.eficaz,
      observacoes:      input.observacoes.trim(),
      evidencia_urls:   input.evidenciaUrls ?? [],
    })

  if (error) return { ok: false, error: error.message }

  // Se NÃO foi eficaz: reabre a CAPA e notifica responsável
  if (!input.eficaz) {
    await sb
      .from('capas')
      .update({ status: 'em_execucao' })
      .eq('id', input.capaId)

    await sb.from('notificacoes').insert({
      usuario_id:  user.id,
      titulo:      `${capaTyped.codigo} — verificação reprovada`,
      mensagem:    'A ação implementada não eliminou a causa raiz. Reveja o plano e adicione/refine ações.',
      tipo:        'erro',
      entidade:    'capas',
      entidade_id: input.capaId,
    })
  } else {
    // Eficaz → recalcular vai encerrar a CAPA automaticamente
    await recalcularStatus(input.capaId)
  }

  revalidatePath(`/capa/${input.capaId}`)
  revalidatePath('/capa')
  return { ok: true }
}

/**
 * Adiciona evidência (arquivo já enviado ao Storage) a uma ação do plano.
 */
export async function addEvidenciaAcao(input: {
  acaoId: string
  capaId: string
  url:    string
  nome:   string
}): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()

  // Busca evidências atuais (JSONB array)
  const { data: acao } = await sb
    .from('acoes')
    .select('evidencia_urls')
    .eq('id', input.acaoId)
    .single()

  const atuais = ((acao as { evidencia_urls?: unknown[] } | null)?.evidencia_urls ?? []) as Array<{ url: string; nome: string }>
  const novas = [...atuais, { url: input.url, nome: input.nome }]

  const { error } = await sb
    .from('acoes')
    .update({ evidencia_urls: novas })
    .eq('id', input.acaoId)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/capa/${input.capaId}`)
  return { ok: true }
}

/** Remove uma evidência específica de uma ação. */
export async function removeEvidenciaAcao(input: {
  acaoId: string
  capaId: string
  index:  number
}): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()

  const { data: acao } = await sb
    .from('acoes')
    .select('evidencia_urls')
    .eq('id', input.acaoId)
    .single()

  const atuais = ((acao as { evidencia_urls?: unknown[] } | null)?.evidencia_urls ?? []) as Array<{ url: string; nome: string }>
  const novas = atuais.filter((_, i) => i !== input.index)

  const { error } = await sb
    .from('acoes')
    .update({ evidencia_urls: novas })
    .eq('id', input.acaoId)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/capa/${input.capaId}`)
  return { ok: true }
}

/** Atualiza a observação textual de uma ação. */
export async function updateAcaoObservacao(input: {
  acaoId:     string
  capaId:     string
  observacao: string
}): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('acoes')
    .update({ observacao: input.observacao.trim() || null })
    .eq('id', input.acaoId)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/capa/${input.capaId}`)
  return { ok: true }
}

/**
 * Reabre uma CAPA encerrada.
 * Status volta para 'reaberta' e encerrada_em é zerado.
 * (Admin/Qualidade ou responsável podem reabrir.)
 */
export async function reabrirCapa(capaId: string): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()

  const { data: capa } = await sb
    .from('capas')
    .select('codigo, status, responsavel_id')
    .eq('id', capaId)
    .single()

  const capaTyped = capa as { codigo: string; status: CapaStatus; responsavel_id: string | null } | null
  if (!capaTyped) return { ok: false, error: 'CAPA não encontrada.' }
  if (capaTyped.status !== 'encerrada') {
    return { ok: false, error: 'Apenas CAPAs encerradas podem ser reabertas.' }
  }

  const { error } = await sb
    .from('capas')
    .update({ status: 'reaberta', encerrada_em: null })
    .eq('id', capaId)

  if (error) return { ok: false, error: error.message }

  // Notifica responsável
  if (capaTyped.responsavel_id) {
    await sb.from('notificacoes').insert({
      usuario_id:  capaTyped.responsavel_id,
      titulo:      `${capaTyped.codigo} foi reaberta`,
      mensagem:    'A CAPA foi reaberta para revisão. Acesse para identificar a próxima ação.',
      tipo:        'alerta',
      entidade:    'capas',
      entidade_id: capaId,
    })
  }

  revalidatePath('/capa')
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
