'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sbService(): Promise<any> { return createServiceClient() as any }

export interface ImportacaoResult {
  ok: boolean
  id?: string
  error?: string
  totalRegistros?: number
  registrosImportados?: number
  registrosErro?: number
  scoreQualidade?: number
  logErros?: Array<{ linha: number; campo: string; mensagem: string }>
}

export interface ProcessarImportacaoInput {
  arquivoNome: string
  tipoEntidade: string
  mapeamento: Record<string, string>  // { colunaCsv -> campoDb }
  linhas: Array<Record<string, string>> // dados do CSV parseados no client
}

/** Valida e processa as linhas mapeadas, retorna score de qualidade */
export async function processarImportacao(input: ProcessarImportacaoInput): Promise<ImportacaoResult> {
  const userSb = await createClient()
  const { data: { user }, error: authErr } = await userSb.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Não autenticado.' }

  const sb = await sbService()

  const erros: Array<{ linha: number; campo: string; mensagem: string }> = []
  const registrosValidos: Array<Record<string, unknown>> = []

  const { tipoEntidade, mapeamento, linhas } = input

  // Campos obrigatórios por entidade
  const REQUIRED: Record<string, string[]> = {
    nao_conformidades: ['titulo', 'descricao'],
    documentos:        ['titulo', 'tipo'],
    indicadores:       ['nome', 'meta'],
    treinamentos:      ['titulo'],
    registros:         ['titulo'],
  }
  const required = REQUIRED[tipoEntidade] ?? []

  linhas.forEach((linha, idx) => {
    const registro: Record<string, unknown> = {}
    let hasError = false

    // Mapear colunas CSV → campos DB
    Object.entries(mapeamento).forEach(([coluna, campo]) => {
      if (campo && campo !== '__ignorar') {
        registro[campo] = linha[coluna]?.trim() ?? null
      }
    })

    // Validar obrigatórios
    required.forEach(campo => {
      if (!registro[campo]) {
        erros.push({ linha: idx + 2, campo, mensagem: `Campo obrigatório "${campo}" vazio` })
        hasError = true
      }
    })

    if (!hasError) registrosValidos.push(registro)
  })

  const totalRegistros = linhas.length
  const registrosErro  = erros.length
  const registrosImportados = registrosValidos.length

  // Score: % de linhas sem erros, penalizado por campos vazios
  const camposPreenchidos = registrosValidos.reduce((acc, r) => {
    const vals = Object.values(r).filter(v => v !== null && v !== '')
    return acc + vals.length
  }, 0)
  const camposTotais = registrosValidos.length * Math.max(Object.keys(mapeamento).length, 1)
  const scoreQualidade = totalRegistros === 0 ? 0 :
    Math.round(((registrosImportados / totalRegistros) * 0.6 +
                (camposTotais > 0 ? (camposPreenchidos / camposTotais) : 1) * 0.4) * 100)

  // Salvar no banco só os válidos (se confirmado)
  let importadosNoBanco = 0
  if (registrosValidos.length > 0 && tipoEntidade) {
    for (const reg of registrosValidos) {
      const { error } = await sb.from(tipoEntidade).insert(reg)
      if (!error) importadosNoBanco++
      else erros.push({ linha: 0, campo: '', mensagem: (error as any).message })
    }
  }

  // Registrar a importação
  const { data: imp } = await sb.from('importacoes').insert({
    arquivo_nome:        input.arquivoNome,
    tipo_entidade:       tipoEntidade,
    mapeamento:          mapeamento,
    status:              importadosNoBanco > 0 ? 'concluida' : 'erro',
    total_registros:     totalRegistros,
    registros_importados: importadosNoBanco,
    registros_erro:      erros.length,
    score_qualidade:     scoreQualidade,
    log_erros:           erros,
    importado_por:       user.id,
    concluida_em:        new Date().toISOString(),
  }).select('id').single()

  revalidatePath('/importacao')
  return {
    ok: true,
    id: (imp as any)?.id,
    totalRegistros,
    registrosImportados: importadosNoBanco,
    registrosErro:       erros.length,
    scoreQualidade,
    logErros: erros,
  }
}

export async function listImportacoes() {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) return []

  const sb = await sbService()
  const { data } = await sb
    .from('importacoes')
    .select('*, importado_por_usuario:usuarios!importado_por(nome)')
    .order('created_at', { ascending: false })
    .limit(20)

  return (data ?? []) as Array<Record<string, unknown>>
}
