// Lógica de progressão automática do CAPA (req. auditor — Fase B)
// SEM 'server-only' — função pura, usada pelo servidor durante mutações.

import type { CapaStatus, AcaoStatus } from '@/types/database'

// ── Métodos de causa raiz suportados ──
export type CausaRaizMetodo = '5_porques' | 'ishikawa' | 'texto_livre'

interface PorqueItem { ordem: number; porque: string; resposta: string }

interface IshikawaData {
  // 6Ms: Método, Máquina, Mão de obra, Material, Medida, Meio ambiente
  metodo?:       string[]
  maquina?:      string[]
  mao_de_obra?:  string[]
  material?:     string[]
  medida?:       string[]
  meio_ambiente?: string[]
}

interface TextoLivreData {
  texto?: string
}

interface CausaRaizDados {
  porques?:    PorqueItem[]
  categorias?: IshikawaData
  texto?:      string
  [key: string]: unknown
}

/**
 * Detecta se a causa raiz tem algum conteúdo preenchido,
 * independente do método escolhido.
 */
export function hasCausaRaiz(
  metodo: string | null | undefined,
  dados:  unknown
): boolean {
  if (!metodo || !dados || typeof dados !== 'object') return false
  const d = dados as CausaRaizDados

  if (metodo === '5_porques') {
    const porques = d.porques ?? []
    return Array.isArray(porques) && porques.some((p) => p?.resposta?.trim())
  }

  if (metodo === 'ishikawa') {
    const cats = d.categorias ?? {}
    return Object.values(cats).some(
      (arr) => Array.isArray(arr) && arr.some((item) => typeof item === 'string' && item.trim())
    )
  }

  if (metodo === 'texto_livre') {
    return typeof d.texto === 'string' && d.texto.trim().length > 0
  }

  return false
}

/**
 * Verifica se há pelo menos uma verificação de eficácia aprovada.
 */
export function hasVerificacaoAprovada(
  verificacoes: Array<{ eficaz: boolean | null }>
): boolean {
  return verificacoes.some((v) => v.eficaz === true)
}

interface AcaoMinima {
  status: AcaoStatus | string
}

/**
 * Calcula o status correto da CAPA com base no estado atual de dados.
 * Fluxo do auditor (mapeado para CapaStatus):
 *   1. aberta          → recém-criada, sem dados
 *   2. em_investigacao → causa raiz preenchida (qualquer método)
 *   3. plano_definido  → tem ≥ 1 ação cadastrada
 *   4. em_execucao     → tem ≥ 1 ação em_andamento
 *   5. verificacao     → 100% das ações concluídas (ou canceladas)
 *   6. encerrada       → verificação de eficácia aprovada
 */
export function computeCapaStatus(input: {
  causaRaizMetodo: string | null
  causaRaizDados:  unknown
  acoes:           AcaoMinima[]
  verificacoes:    Array<{ eficaz: boolean | null }>
  encerradaManualmente?: boolean  // override manual (Qualidade força encerramento)
}): CapaStatus {
  const { causaRaizMetodo, causaRaizDados, acoes, verificacoes, encerradaManualmente } = input

  // Override: Qualidade pode forçar encerramento manual
  if (encerradaManualmente) return 'encerrada'

  // 6. Verificação eficácia aprovada → encerrada
  if (hasVerificacaoAprovada(verificacoes)) return 'encerrada'

  // Sem ações cadastradas ainda
  if (acoes.length === 0) {
    return hasCausaRaiz(causaRaizMetodo, causaRaizDados)
      ? 'em_investigacao'
      : 'aberta'
  }

  // Tem ações: avaliar progresso
  const naoFinalizadas = acoes.filter(
    (a) => a.status !== 'concluida' && a.status !== 'cancelada'
  )

  // 5. Todas concluídas → verificação
  if (naoFinalizadas.length === 0) return 'verificacao'

  // 4. Pelo menos 1 em andamento → em execução
  if (acoes.some((a) => a.status === 'em_andamento')) return 'em_execucao'

  // 3. Tem ações mas todas pendentes → plano definido
  return 'plano_definido'
}

/**
 * Calcula severidade da NC com base no quão abaixo da meta o indicador ficou.
 *   < 50% da meta → crítica
 *   < 80% da meta → maior
 *   senão         → menor
 */
export function severidadePorDesvio(valor: number, meta: number): 'menor' | 'maior' | 'critica' {
  if (meta <= 0) return 'menor'
  const pct = (valor / meta) * 100
  if (pct < 50) return 'critica'
  if (pct < 80) return 'maior'
  return 'menor'
}
