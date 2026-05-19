import 'server-only'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calcSemaforo } from '@/lib/utils/indicadores-utils'
export { calcSemaforo } from '@/lib/utils/indicadores-utils'

export type IndicadorRow = {
  id: string
  codigo: string | null
  nome: string
  descricao: string | null
  formula: string | null
  unidade_medida: string | null
  meta: number | null
  frequencia: string | null
  area_id: string | null
  responsavel_id: string | null
  gerar_nc_abaixo_meta: boolean
  ativo: boolean
  created_at: string
  updated_at: string
}

export type ResultadoRow = {
  id: string
  indicador_id: string
  periodo: string
  valor: number
  observacoes: string | null
  evidencia_url: string | null
  nc_gerada_id: string | null
  registrado_por: string | null
  created_at: string
}

export type IndicadorComRelacoes = IndicadorRow & {
  areas: { nome: string; unidades: { nome: string } | null } | null
  responsavel: { nome: string } | null
  ultimo_resultado: ResultadoRow | null
}

export type IndicadorStats = {
  total: number
  ativos: number
  no_verde: number       // valor >= meta (ou >= 95% da meta)
  no_amarelo: number     // 80-95% da meta
  no_vermelho: number    // < 80% da meta
  sem_resultado: number
}


export async function listIndicadores(): Promise<IndicadorComRelacoes[]> {
  // Service client: RLS exigia usuario_unidades configurado, bloqueando seed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  const { data, error } = await sb
    .from('indicadores')
    .select(`
      *,
      areas ( nome, unidades ( nome ) ),
      responsavel:usuarios!responsavel_id ( nome )
    `)
    .order('nome', { ascending: true })

  if (error) { console.error('listIndicadores', error); return [] }

  // Para cada indicador, buscar o último resultado
  const indicadores = (data ?? []) as IndicadorRow[]
  const ids = indicadores.map((i) => i.id)

  let ultimosResultados: ResultadoRow[] = []
  if (ids.length > 0) {
    const { data: res } = await sb
      .from('resultados_indicadores')
      .select('*')
      .in('indicador_id', ids)
      .order('created_at', { ascending: false })

    ultimosResultados = (res ?? []) as ResultadoRow[]
  }

  // Mapeia cada indicador com seu resultado mais recente
  const ultimoMap = new Map<string, ResultadoRow>()
  for (const r of ultimosResultados) {
    if (!ultimoMap.has(r.indicador_id)) ultimoMap.set(r.indicador_id, r)
  }

  return indicadores.map((ind: any) => ({
    ...ind,
    ultimo_resultado: ultimoMap.get(ind.id) ?? null,
  })) as IndicadorComRelacoes[]
}

export async function getIndicador(id: string): Promise<IndicadorComRelacoes | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  const { data, error } = await sb
    .from('indicadores')
    .select(`
      *,
      areas ( nome, unidades ( nome ) ),
      responsavel:usuarios!responsavel_id ( nome )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  // Último resultado
  const { data: res } = await sb
    .from('resultados_indicadores')
    .select('*')
    .eq('indicador_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return { ...data, ultimo_resultado: res ?? null } as IndicadorComRelacoes
}

export async function getResultados(indicadorId: string): Promise<ResultadoRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  const { data, error } = await sb
    .from('resultados_indicadores')
    .select('*')
    .eq('indicador_id', indicadorId)
    .order('periodo', { ascending: false })

  if (error) return []
  return (data ?? []) as ResultadoRow[]
}

export async function getIndicadorStats(): Promise<IndicadorStats> {
  const list = await listIndicadores()
  const ativos = list.filter((i) => i.ativo)

  let verde = 0, amarelo = 0, vermelho = 0, semDado = 0
  for (const ind of ativos) {
    const s = calcSemaforo(ind.ultimo_resultado?.valor ?? null, ind.meta)
    if (s === 'verde')    verde++
    else if (s === 'amarelo') amarelo++
    else if (s === 'vermelho') vermelho++
    else semDado++
  }

  return {
    total: list.length,
    ativos: ativos.length,
    no_verde:      verde,
    no_amarelo:    amarelo,
    no_vermelho:   vermelho,
    sem_resultado: semDado,
  }
}
