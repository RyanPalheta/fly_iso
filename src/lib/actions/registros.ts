'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { RegistroCampoDef, RegistroDescarteAcao } from '@/types/database'

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
// REGISTRO TIPOS (templates)
// ════════════════════════════════════════════════════════════════════════════

export interface CreateRegistroTipoInput {
  codigo:        string
  nome:          string
  descricao?:    string
  campos:        RegistroCampoDef[]
  retencaoMeses: number
  descarteAcao:  RegistroDescarteAcao
}

function validarCampos(campos: RegistroCampoDef[]): string | null {
  if (!Array.isArray(campos) || campos.length === 0) return 'Adicione pelo menos um campo.'
  const ids = new Set<string>()
  for (const c of campos) {
    if (!c.id?.trim())    return `Campo sem id: "${c.label}"`
    if (!c.label?.trim()) return `Campo "${c.id}" sem label.`
    if (ids.has(c.id))    return `Campo duplicado: "${c.id}"`
    ids.add(c.id)
    if (c.type === 'select' && (!c.options || c.options.length === 0)) {
      return `Campo "${c.label}" do tipo select precisa de opções.`
    }
  }
  return null
}

export async function createRegistroTipo(input: CreateRegistroTipoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  if (!input.codigo?.trim()) return { ok: false, error: 'Código obrigatório.' }
  if (!input.nome?.trim())   return { ok: false, error: 'Nome obrigatório.' }
  if (input.retencaoMeses < 0) return { ok: false, error: 'Retenção não pode ser negativa.' }
  const err = validarCampos(input.campos)
  if (err) return { ok: false, error: err }

  const sb = await sbService()
  const { data, error } = await sb
    .from('registro_tipos')
    .insert({
      codigo:         input.codigo.trim().toUpperCase(),
      nome:           input.nome.trim(),
      descricao:      input.descricao?.trim() || null,
      campos:         input.campos,
      retencao_meses: input.retencaoMeses,
      descarte_acao:  input.descarteAcao,
      ativo:          true,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/configuracoes/registros-tipos')
  return { ok: true, id: (data as { id: string }).id }
}

export interface UpdateRegistroTipoInput extends CreateRegistroTipoInput {
  id:    string
  ativo: boolean
}

export async function updateRegistroTipo(input: UpdateRegistroTipoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const err = validarCampos(input.campos)
  if (err) return { ok: false, error: err }

  const sb = await sbService()
  const { error } = await sb
    .from('registro_tipos')
    .update({
      codigo:         input.codigo.trim().toUpperCase(),
      nome:           input.nome.trim(),
      descricao:      input.descricao?.trim() || null,
      campos:         input.campos,
      retencao_meses: input.retencaoMeses,
      descarte_acao:  input.descarteAcao,
      ativo:          input.ativo,
    })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/configuracoes/registros-tipos')
  revalidatePath(`/configuracoes/registros-tipos/${input.id}`)
  return { ok: true }
}

// ════════════════════════════════════════════════════════════════════════════
// REGISTROS (entries com dados dinâmicos)
// ════════════════════════════════════════════════════════════════════════════

/** Gera próximo código REG-YYYY-NNNN para o tipo. */
async function gerarCodigoRegistro(tipoCodigo: string): Promise<string> {
  const sb = await sbService()
  const ano = new Date().getFullYear()
  const prefix = `${tipoCodigo}-${ano}-`
  const { data } = await sb
    .from('registros')
    .select('codigo')
    .ilike('codigo', `${prefix}%`)
    .order('created_at', { ascending: false })
    .limit(100)

  let max = 0
  for (const row of (data ?? []) as Array<{ codigo: string | null }>) {
    if (!row.codigo) continue
    const m = row.codigo.match(new RegExp(`${prefix}(\\d+)$`))
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

export interface CreateRegistroInput {
  tipoId:         string
  titulo:         string
  dados:          Record<string, unknown>
  areaId?:        string
  documentoId?:   string
  dataCriacao?:   string       // ISO date
}

export async function createRegistro(input: CreateRegistroInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  if (!input.tipoId)         return { ok: false, error: 'Tipo de registro obrigatório.' }
  if (!input.titulo?.trim()) return { ok: false, error: 'Título obrigatório.' }

  const sb = await sbService()

  // Busca tipo para validar campos obrigatórios + calcular prazo de descarte
  const { data: tipoRow, error: tipoErr } = await sb
    .from('registro_tipos')
    .select('codigo, campos, retencao_meses, descarte_acao')
    .eq('id', input.tipoId)
    .single()

  if (tipoErr || !tipoRow) return { ok: false, error: 'Tipo de registro inválido.' }

  const tipo = tipoRow as { codigo: string; campos: RegistroCampoDef[]; retencao_meses: number; descarte_acao: RegistroDescarteAcao }

  // Validação dos campos obrigatórios
  for (const c of tipo.campos) {
    if (!c.required) continue
    const val = input.dados[c.id]
    const vazio = val === undefined || val === null || val === '' ||
                  (Array.isArray(val) && val.length === 0)
    if (vazio) return { ok: false, error: `Campo obrigatório: ${c.label}` }
  }

  // Gera código + calcula prazo
  const codigo = await gerarCodigoRegistro(tipo.codigo)
  const dataCriacao = input.dataCriacao || new Date().toISOString().split('T')[0]
  let prazoDescarte: string | null = null
  if (tipo.descarte_acao !== 'reter_indefinidamente' && tipo.retencao_meses > 0) {
    const dt = new Date(dataCriacao)
    dt.setMonth(dt.getMonth() + tipo.retencao_meses)
    prazoDescarte = dt.toISOString().split('T')[0]
  }

  const { data, error } = await sb
    .from('registros')
    .insert({
      tipo_id:        input.tipoId,
      codigo,
      titulo:         input.titulo.trim(),
      dados:          input.dados,
      area_id:        input.areaId || null,
      documento_id:   input.documentoId || null,
      data_criacao:   dataCriacao,
      prazo_descarte: prazoDescarte,
      status:         'ativo',
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/registros')
  return { ok: true, id: (data as { id: string }).id }
}

export async function updateRegistroStatus(
  id: string,
  status: 'ativo' | 'arquivado' | 'descartado'
): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const hoje = new Date().toISOString().split('T')[0]
  const { error } = await sb
    .from('registros')
    .update({
      status,
      ...(status === 'arquivado' ? { data_arquivamento: hoje, arquivado_em: new Date().toISOString() } : {}),
      ...(status === 'descartado' ? { data_descarte: hoje } : {}),
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/registros')
  revalidatePath(`/registros/${id}`)
  return { ok: true }
}

/**
 * Varre registros ativos com prazo_descarte vencido e aplica a ação do tipo
 * (arquivar / descartar). Pode ser chamada por admin ou cron job.
 */
export async function processarDescarteVencidos(): Promise<ActionResult & { processados?: number }> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const hoje = new Date().toISOString().split('T')[0]

  // Busca registros vencidos com tipo associado
  const { data: vencidos, error: errV } = await sb
    .from('registros')
    .select('id, tipo_id, registro_tipos!tipo_id(descarte_acao)')
    .lt('prazo_descarte', hoje)
    .is('arquivado_em', null)
    .eq('status', 'ativo')

  if (errV) return { ok: false, error: errV.message }

  const rows = (vencidos ?? []) as Array<{
    id: string
    tipo_id: string | null
    registro_tipos: { descarte_acao: RegistroDescarteAcao } | null
  }>

  let processados = 0
  for (const r of rows) {
    const acao = r.registro_tipos?.descarte_acao ?? 'arquivar'
    if (acao === 'reter_indefinidamente') continue

    const novoStatus = acao === 'descartar' ? 'descartado' : 'arquivado'
    await sb.from('registros').update({
      status:            novoStatus,
      arquivado_em:      new Date().toISOString(),
      ...(novoStatus === 'arquivado' ? { data_arquivamento: hoje } : { data_descarte: hoje }),
    }).eq('id', r.id)
    processados++
  }

  revalidatePath('/registros')
  return { ok: true, processados }
}
