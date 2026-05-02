'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sbService(): Promise<any> {
  return (await createServiceClient()) as any
}

export interface CreateIndicadorInput {
  nome: string
  descricao: string
  formula: string
  unidadeMedida: string
  meta: number
  frequencia: string
  areaId: string
  responsavelId: string
  gerarNcAbaixoMeta: boolean
}

export interface LancarResultadoInput {
  indicadorId: string
  periodo: string
  valor: number
  observacoes: string
}

export interface ActionResult {
  ok: boolean
  id?: string
  error?: string
}

async function gerarCodigoIndicador(): Promise<string> {
  const sb = await sbService()
  const { data } = await sb.from('indicadores').select('codigo').order('created_at', { ascending: false }).limit(50)
  let max = 0
  for (const row of (data ?? []) as Array<{ codigo: string | null }>) {
    const m = row.codigo?.match(/IND-(\d+)/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `IND-${String(max + 1).padStart(3, '0')}`
}

export async function createIndicador(input: CreateIndicadorInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user }, error: authErr } = await userSb.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Não autenticado.' }

  const codigo = await gerarCodigoIndicador()
  const sb = await sbService()

  const { data, error } = await sb
    .from('indicadores')
    .insert({
      codigo,
      nome:                 input.nome,
      descricao:            input.descricao || null,
      formula:              input.formula || null,
      unidade_medida:       input.unidadeMedida || null,
      meta:                 input.meta,
      frequencia:           input.frequencia,
      area_id:              input.areaId || null,
      responsavel_id:       input.responsavelId || null,
      gerar_nc_abaixo_meta: input.gerarNcAbaixoMeta,
      ativo:                true,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath('/indicadores')
  return { ok: true, id: (data as { id: string }).id }
}

export async function lancarResultado(input: LancarResultadoInput): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user }, error: authErr } = await userSb.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()

  // Busca indicador para verificar meta e flag gerar_nc
  const { data: ind } = await sb
    .from('indicadores')
    .select('meta, gerar_nc_abaixo_meta, nome, area_id, responsavel_id')
    .eq('id', input.indicadorId)
    .single()

  const { data, error } = await sb
    .from('resultados_indicadores')
    .insert({
      indicador_id:  input.indicadorId,
      periodo:       input.periodo,
      valor:         input.valor,
      observacoes:   input.observacoes || null,
      registrado_por: user.id,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: (error as { message: string }).message }

  const resultadoId = (data as { id: string }).id

  // Auto-geração de NC se valor abaixo de meta e flag ativada
  if (ind?.gerar_nc_abaixo_meta && ind?.meta !== null && input.valor < ind.meta) {
    const pct = (input.valor / ind.meta * 100).toFixed(1)

    // Gera código NC
    const { data: ncsExistentes } = await sb
      .from('nao_conformidades')
      .select('codigo')
      .order('created_at', { ascending: false })
      .limit(50)

    let maxNC = 0
    for (const row of (ncsExistentes ?? []) as Array<{ codigo: string }>) {
      const m = row.codigo?.match(/NC-(\d+)/)
      if (m) maxNC = Math.max(maxNC, parseInt(m[1], 10))
    }
    const codigoNC = `NC-${String(maxNC + 1).padStart(3, '0')}`

    const { data: nc } = await sb
      .from('nao_conformidades')
      .insert({
        codigo:          codigoNC,
        titulo:          `Indicador ${ind.nome} abaixo da meta (${pct}%)`,
        descricao:       `O indicador "${ind.nome}" atingiu ${input.valor} no período ${input.periodo}, representando ${pct}% da meta de ${ind.meta}. NC gerada automaticamente.`,
        area_id:         ind.area_id ?? null,
        responsavel_id:  ind.responsavel_id ?? null,
        detectado_por:   user.id,
        origem:          'indicador',
        severidade:      'menor',
        status:          'registrada',
        indicador_id:    input.indicadorId,
      })
      .select('id')
      .single()

    if (nc) {
      // Vincula NC gerada ao resultado
      await sb
        .from('resultados_indicadores')
        .update({ nc_gerada_id: (nc as { id: string }).id })
        .eq('id', resultadoId)

      revalidatePath('/nao-conformidades')
    }
  }

  revalidatePath(`/indicadores/${input.indicadorId}`)
  revalidatePath('/indicadores')
  return { ok: true, id: resultadoId }
}

export async function toggleIndicadorAtivo(id: string, ativo: boolean): Promise<ActionResult> {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()
  const { error } = await sb.from('indicadores').update({ ativo }).eq('id', id)

  if (error) return { ok: false, error: (error as { message: string }).message }
  revalidatePath('/indicadores')
  return { ok: true }
}
