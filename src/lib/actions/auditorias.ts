'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { AuditoriaPergunta, AuditoriaStatus, AuditoriaTipo } from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sbService(): Promise<any> {
  return (await createServiceClient()) as any
}

export interface ActionResult {
  ok:     boolean
  id?:    string
  error?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CHECKLISTS
// ════════════════════════════════════════════════════════════════════════════

function validarPerguntas(ps: AuditoriaPergunta[]): string | null {
  if (!Array.isArray(ps) || ps.length === 0) return 'Adicione pelo menos uma pergunta.'
  const ids = new Set<string>()
  for (const p of ps) {
    if (!p.id?.trim())    return `Pergunta sem id: "${p.texto?.slice(0, 40)}"`
    if (!p.texto?.trim()) return `Pergunta "${p.id}" sem texto.`
    if (ids.has(p.id))    return `Pergunta duplicada: "${p.id}"`
    if (!p.opcoes || p.opcoes.length < 2) return `Pergunta "${p.id}" precisa de pelo menos 2 opções de resposta.`
    if (typeof p.peso !== 'number' || p.peso < 0) return `Pergunta "${p.id}" tem peso inválido.`
    ids.add(p.id)
  }
  return null
}

export interface SaveChecklistInput {
  id?:         string
  codigo:      string
  nome:        string
  descricao?:  string
  tipo?:       string
  perguntas:   AuditoriaPergunta[]
  ativo?:      boolean
}

export async function saveChecklist(input: SaveChecklistInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  if (!input.codigo?.trim()) return { ok: false, error: 'Código obrigatório.' }
  if (!input.nome?.trim())   return { ok: false, error: 'Nome obrigatório.' }
  const err = validarPerguntas(input.perguntas)
  if (err) return { ok: false, error: err }

  const sb = await sbService()
  const payload = {
    codigo:    input.codigo.trim().toUpperCase(),
    nome:      input.nome.trim(),
    descricao: input.descricao?.trim() || null,
    tipo:      input.tipo || null,
    perguntas: input.perguntas,
    ativo:     input.ativo ?? true,
  }

  if (input.id) {
    const { error } = await sb.from('auditoria_checklists').update(payload).eq('id', input.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/auditorias/checklists')
    revalidatePath(`/auditorias/checklists/${input.id}`)
    return { ok: true, id: input.id }
  } else {
    const { data, error } = await sb.from('auditoria_checklists').insert(payload).select('id').single()
    if (error) return { ok: false, error: error.message }
    revalidatePath('/auditorias/checklists')
    return { ok: true, id: (data as { id: string }).id }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AUDITORIAS
// ════════════════════════════════════════════════════════════════════════════

async function gerarCodigoAuditoria(): Promise<string> {
  const sb = await sbService()
  const ano = new Date().getFullYear()
  const prefix = `AUD-${ano}-`
  const { data } = await sb
    .from('auditorias').select('codigo').ilike('codigo', `${prefix}%`)
    .order('created_at', { ascending: false }).limit(100)

  let max = 0
  for (const row of (data ?? []) as Array<{ codigo: string }>) {
    const m = row.codigo.match(new RegExp(`${prefix}(\\d+)$`))
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export interface CreateAuditoriaInput {
  titulo:           string
  tipo:             AuditoriaTipo
  escopo?:          string
  criterios?:       string
  dataPlanejada?:   string
  auditorLiderId?:  string
  auditores?:       string[]
  areaId?:          string
  unidadeId?:       string
  checklistIds:     string[]
}

export async function createAuditoria(input: CreateAuditoriaInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  if (!input.titulo?.trim()) return { ok: false, error: 'Título obrigatório.' }
  if (!input.checklistIds || input.checklistIds.length === 0) {
    return { ok: false, error: 'Selecione pelo menos um checklist.' }
  }

  const codigo = await gerarCodigoAuditoria()
  const sb = await sbService()
  const { data, error } = await sb
    .from('auditorias')
    .insert({
      codigo,
      titulo:           input.titulo.trim(),
      tipo:             input.tipo,
      escopo:           input.escopo?.trim() || null,
      criterios:        input.criterios?.trim() || null,
      data_planejada:   input.dataPlanejada || null,
      auditor_lider_id: input.auditorLiderId || null,
      auditores:        input.auditores ?? [],
      area_id:          input.areaId || null,
      unidade_id:       input.unidadeId || null,
      checklist_ids:    input.checklistIds,
      status:           'planejada',
      created_by:       user.id,
    })
    .select('id').single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/auditorias')
  return { ok: true, id: (data as { id: string }).id }
}

export async function updateAuditoriaStatus(
  id: string, status: AuditoriaStatus
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const patch: Record<string, unknown> = { status }
  if (status === 'em_execucao') patch.data_realizada = new Date().toISOString().split('T')[0]
  if (status === 'concluida')   patch.concluida_em   = new Date().toISOString()

  const { error } = await sb.from('auditorias').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/auditorias')
  revalidatePath(`/auditorias/${id}`)
  return { ok: true }
}

export interface ResponderPerguntaInput {
  auditoriaId:    string
  checklistId:    string
  perguntaId:     string
  respostaValor:  string
  observacao?:    string
  evidencias?:    Array<{ url: string; nome: string }>
}

export async function responderPergunta(input: ResponderPerguntaInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()

  // Carrega o checklist + pergunta pra snapshot + cálculo dos pontos
  const { data: chk, error: chkErr } = await sb
    .from('auditoria_checklists').select('perguntas').eq('id', input.checklistId).single()
  if (chkErr) return { ok: false, error: chkErr.message }

  const perguntas = (chk as { perguntas: AuditoriaPergunta[] }).perguntas
  const pergunta = perguntas.find((p) => p.id === input.perguntaId)
  if (!pergunta) return { ok: false, error: 'Pergunta não encontrada no checklist.' }

  const opcao = pergunta.opcoes.find((o) => o.valor === input.respostaValor)
  if (!opcao) return { ok: false, error: 'Opção de resposta inválida.' }

  // Upsert via DELETE + INSERT (mais simples que onConflict sem unique exposto)
  await sb.from('auditoria_respostas').delete()
    .eq('auditoria_id', input.auditoriaId)
    .eq('checklist_id', input.checklistId)
    .eq('pergunta_id',  input.perguntaId)

  const pontos = opcao.pontos !== null ? opcao.pontos * pergunta.peso : null

  const { error } = await sb.from('auditoria_respostas').insert({
    auditoria_id:      input.auditoriaId,
    checklist_id:      input.checklistId,
    pergunta_id:       input.perguntaId,
    pergunta_snapshot: pergunta,
    resposta_valor:    input.respostaValor,
    pontos,
    observacao:        input.observacao?.trim() || null,
    evidencias:        input.evidencias ?? [],
    respondido_por:    user.id,
    respondido_em:     new Date().toISOString(),
  })
  if (error) return { ok: false, error: error.message }

  // Atualiza pontuação total da auditoria
  await recalcularPontuacao(input.auditoriaId)

  revalidatePath(`/auditorias/${input.auditoriaId}`)
  return { ok: true }
}

async function recalcularPontuacao(auditoriaId: string) {
  const sb = await sbService()

  // Soma pontos atribuídos (não N/A) e máximo possível das perguntas respondidas
  const { data: resps } = await sb
    .from('auditoria_respostas').select('pontos, pergunta_snapshot')
    .eq('auditoria_id', auditoriaId)

  let total = 0, max = 0
  for (const r of (resps ?? []) as Array<{ pontos: number | null; pergunta_snapshot: AuditoriaPergunta | null }>) {
    if (r.pontos === null) continue
    total += r.pontos
    if (r.pergunta_snapshot) {
      const maxOpc = Math.max(0, ...r.pergunta_snapshot.opcoes
        .filter((o) => o.pontos !== null)
        .map((o) => (o.pontos as number) * r.pergunta_snapshot!.peso))
      max += maxOpc
    }
  }
  await sb.from('auditorias').update({
    pontuacao_total: total,
    pontuacao_max:   max,
  }).eq('id', auditoriaId)
}

/**
 * Cria NC a partir de uma resposta crítica (nc_menor/nc_maior).
 * Vincula a resposta à NC criada.
 */
export async function criarNCdaResposta(
  respostaId: string, severidade: 'menor' | 'maior' | 'critica'
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { data: resp, error: rErr } = await sb
    .from('auditoria_respostas')
    .select('id, auditoria_id, pergunta_snapshot, observacao')
    .eq('id', respostaId).single()
  if (rErr || !resp) return { ok: false, error: 'Resposta não encontrada.' }

  const respRow = resp as {
    id: string
    auditoria_id: string
    pergunta_snapshot: AuditoriaPergunta | null
    observacao: string | null
  }

  // Fetch auditoria separadamente (evita embed)
  const { data: aud } = await sb.from('auditorias')
    .select('codigo, titulo, area_id').eq('id', respRow.auditoria_id).single()
  const r = {
    ...respRow,
    auditorias: aud as { codigo: string; titulo: string; area_id: string | null } | null,
  }

  // Próximo código NC
  const ano = new Date().getFullYear()
  const prefix = `NC-${ano}-`
  const { data: ncList } = await sb.from('nao_conformidades').select('codigo').ilike('codigo', `${prefix}%`)
  let max = 0
  for (const n of (ncList ?? []) as Array<{ codigo: string }>) {
    const m = n.codigo.match(new RegExp(`${prefix}(\\d+)$`))
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  const codigoNC = `${prefix}${String(max + 1).padStart(3, '0')}`

  const titulo = `Auditoria ${r.auditorias?.codigo ?? ''}: ${r.pergunta_snapshot?.texto?.slice(0, 80) ?? 'NC'}`
  const descricao = [
    `Identificada na auditoria ${r.auditorias?.codigo} — ${r.auditorias?.titulo}.`,
    r.pergunta_snapshot?.clausula ? `Cláusula: ${r.pergunta_snapshot.clausula}` : null,
    r.pergunta_snapshot?.texto ? `Item: ${r.pergunta_snapshot.texto}` : null,
    r.observacao ? `Observação do auditor: ${r.observacao}` : null,
  ].filter(Boolean).join('\n\n')

  const { data: ncRow, error: ncErr } = await sb.from('nao_conformidades').insert({
    codigo:     codigoNC,
    titulo,
    descricao,
    origem:     'auditoria_interna',
    severidade,
    status:     'registrada',
    area_id:    r.auditorias?.area_id ?? null,
    detectado_por:  user.id,
    tipo_acao:  'corretiva',
  }).select('id').single()

  if (ncErr) return { ok: false, error: ncErr.message }

  // Vincula a resposta à NC criada
  await sb.from('auditoria_respostas').update({ nc_id: (ncRow as { id: string }).id }).eq('id', r.id)

  revalidatePath(`/auditorias/${r.auditoria_id}`)
  revalidatePath('/nao-conformidades')
  return { ok: true, id: (ncRow as { id: string }).id }
}
