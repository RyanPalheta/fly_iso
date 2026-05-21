'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { TreinamentoCategoria, TreinamentoTurno } from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sbService(): Promise<any> {
  return (await createServiceClient()) as any
}

export interface ActionResult {
  ok: boolean
  id?: string
  error?: string
}

export interface ParticipanteInput {
  usuarioId?: string         // se for colaborador interno cadastrado
  nome?:      string         // fallback se não cadastrado
  matricula?: string
  setor?:     string
  turno?:     TreinamentoTurno
}

export interface CreateTreinamentoInput {
  categoria:        TreinamentoCategoria   // 'interno' | 'externo'
  titulo:           string
  descricao?:       string
  instrutor?:       string
  dataTreinamento?: string
  validadeMeses?:   number
  areaId?:          string
  tipo?:            string                  // presencial | leitura (interno) | online (externo)
  // Interno
  documentoId?:     string
  revisaoDoc?:      number
  // Externo
  entidadePromotora?: string
  cargaHoraria?:    number
  mesPlanejado?:    string                 // YYYY-MM
  custo?:           number
  // Participantes (formato novo)
  participantes:    ParticipanteInput[]
}

export async function createTreinamento(input: CreateTreinamentoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user }, error: authErr } = await userSb.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Não autenticado.' }

  if (!input.titulo?.trim()) return { ok: false, error: 'Título obrigatório.' }
  if (input.categoria === 'interno' && !input.documentoId) {
    return { ok: false, error: 'Treinamento interno deve estar vinculado a um documento.' }
  }
  if (input.categoria === 'externo' && !input.entidadePromotora?.trim()) {
    return { ok: false, error: 'Treinamento externo exige entidade promotora.' }
  }

  const sb = await sbService()

  // Se interno, busca a revisão atual do documento como snapshot
  let revisaoSnapshot = input.revisaoDoc ?? null
  if (input.categoria === 'interno' && input.documentoId && revisaoSnapshot === null) {
    const { data: doc } = await sb
      .from('documentos')
      .select('revisao_atual')
      .eq('id', input.documentoId)
      .single()
    revisaoSnapshot = (doc as { revisao_atual: number } | null)?.revisao_atual ?? 0
  }

  const { data, error } = await sb
    .from('treinamentos')
    .insert({
      categoria:          input.categoria,
      titulo:             input.titulo.trim(),
      descricao:          input.descricao?.trim() || null,
      instrutor:          input.instrutor?.trim() || null,
      data_treinamento:   input.dataTreinamento || null,
      validade_meses:     input.validadeMeses || null,
      area_id:            input.areaId || null,
      tipo:               input.tipo || (input.categoria === 'interno' ? 'presencial' : 'presencial'),
      documento_id:       input.documentoId || null,
      revisao_doc:        revisaoSnapshot,
      entidade_promotora: input.entidadePromotora?.trim() || null,
      carga_horaria:      input.cargaHoraria || null,
      mes_planejado:      input.mesPlanejado || null,
      custo:              input.custo || null,
      status:             'planejado',
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: (error as { message: string }).message }
  const treinamentoId = (data as { id: string }).id

  // Insere participantes com campos do auditor
  if (input.participantes.length > 0) {
    const rows = input.participantes.map((p) => ({
      treinamento_id: treinamentoId,
      usuario_id:     p.usuarioId || null,
      nome_snapshot:  p.nome || null,
      matricula:      p.matricula || null,
      setor:          p.setor || null,
      turno:          p.turno || null,
      status:         'pendente',
    }))
    const { error: pErr } = await sb.from('treinamento_participantes').insert(rows)
    if (pErr) {
      console.error('[createTreinamento] participantes:', pErr.message)
    }
  }

  revalidatePath('/treinamentos')
  return { ok: true, id: treinamentoId }
}

export async function updateTreinamentoStatus(
  id: string,
  status: 'planejado' | 'realizado' | 'cancelado'
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb.from('treinamentos').update({ status }).eq('id', id)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath('/treinamentos')
  revalidatePath(`/treinamentos/${id}`)
  return { ok: true }
}

export async function updateParticipanteStatus(
  participanteId: string,
  treinamentoId: string,
  status: 'pendente' | 'concluido' | 'ausente'
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('treinamento_participantes')
    .update({ status })
    .eq('id', participanteId)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath(`/treinamentos/${treinamentoId}`)
  return { ok: true }
}

export async function registrarAceiteDigital(
  participanteId: string,
  treinamentoId: string
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb
    .from('treinamento_participantes')
    .update({ aceite_digital: true, aceite_em: new Date().toISOString(), status: 'concluido' })
    .eq('id', participanteId)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath(`/treinamentos/${treinamentoId}`)
  return { ok: true }
}

/**
 * Avaliação de eficácia (auditor: obrigatória).
 * Se ineficaz, observação é obrigatória.
 */
export interface RegistrarAvaliacaoEficaciaInput {
  treinamentoId:  string
  eficaz:         boolean
  observacao:     string
  evidenciaUrls?: Array<{ url: string; nome: string }>
}

export async function registrarAvaliacaoEficacia(
  input: RegistrarAvaliacaoEficaciaInput
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  if (!input.observacao.trim()) {
    return { ok: false, error: 'Observação é obrigatória (req. auditor).' }
  }
  if (!input.eficaz && input.observacao.length < 20) {
    return { ok: false, error: 'Justifique com detalhe quando o treinamento for ineficaz.' }
  }

  const sb = await sbService()
  const { error } = await sb
    .from('treinamento_avaliacao_eficacia')
    .insert({
      treinamento_id: input.treinamentoId,
      eficaz:         input.eficaz,
      observacao:     input.observacao.trim(),
      evidencia_urls: input.evidenciaUrls ?? [],
      avaliado_por:   user.id,
    })

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/treinamentos/${input.treinamentoId}`)
  return { ok: true }
}

/**
 * Trigger de retreinamento — chamado por createVersao() quando uma nova versão
 * de documento é publicada. Notifica todos os participantes de treinamentos
 * internos ATIVOS vinculados a esse documento que a revisão mudou.
 */
export async function notificarRetreinamento(documentoId: string, novaRevisao: number): Promise<void> {
  const sb = await sbService()

  // Busca treinamentos internos do documento + participantes
  const { data: treinamentos } = await sb
    .from('treinamentos')
    .select(`
      id, titulo, revisao_doc,
      documento:documentos!documento_id ( codigo, titulo ),
      treinamento_participantes ( usuario_id )
    `)
    .eq('documento_id', documentoId)
    .eq('categoria', 'interno')

  const rows = (treinamentos ?? []) as Array<{
    id:           string
    titulo:       string
    revisao_doc:  number | null
    documento:    { codigo: string; titulo: string } | null
    treinamento_participantes: Array<{ usuario_id: string | null }>
  }>

  if (rows.length === 0) return

  // Monta notificações para cada participante único
  const notifs: Array<Record<string, unknown>> = []
  const seen = new Set<string>()

  for (const t of rows) {
    // Só notifica se a revisão snapshot é menor que a nova
    if (t.revisao_doc !== null && t.revisao_doc >= novaRevisao) continue

    for (const p of t.treinamento_participantes) {
      if (!p.usuario_id) continue
      const key = `${p.usuario_id}-${t.id}`
      if (seen.has(key)) continue
      seen.add(key)

      notifs.push({
        usuario_id:  p.usuario_id,
        titulo:      `Retreinamento necessário: ${t.documento?.codigo ?? t.titulo}`,
        mensagem:    `O documento foi atualizado para v${novaRevisao}. Você precisa fazer novo treinamento.`,
        tipo:        'alerta',
        entidade:    'treinamentos',
        entidade_id: t.id,
      })
    }
  }

  if (notifs.length > 0) {
    await sb.from('notificacoes').insert(notifs)
  }
}
