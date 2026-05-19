// Utilitários compartilhados (server + client) — NÃO importe 'server-only' aqui.

import type { AcaoStatus, AcaoStatusEfetivo } from '@/types/database'

/**
 * Calcula o status EFETIVO de uma ação CAPA:
 *  - Se o status persistido é 'concluida' ou 'cancelada' → retorna como está.
 *  - Se o prazo é nulo → retorna o status persistido.
 *  - Se o prazo já passou e status é 'pendente'|'em_andamento' → retorna 'atrasada'.
 *  - Caso contrário → retorna o status persistido.
 *
 * O status 'atrasada' é DERIVADO, não armazenado no banco — assim ele se
 * autocorrige quando o prazo é alterado ou a ação é concluída.
 */
export function effectiveAcaoStatus(
  status: AcaoStatus,
  prazo: string | null,
): AcaoStatusEfetivo {
  if (status === 'concluida' || status === 'cancelada') return status
  if (!prazo) return status

  const hojeISO = new Date().toISOString().split('T')[0]
  // 'YYYY-MM-DD' < 'YYYY-MM-DD' é comparação lexicográfica válida
  return prazo < hojeISO ? 'atrasada' : status
}

/**
 * Conta quantas ações estão efetivamente atrasadas em um conjunto.
 */
export function countAcoesAtrasadas(
  acoes: Array<{ status: AcaoStatus; prazo: string | null }>,
): number {
  return acoes.filter((a) => effectiveAcaoStatus(a.status, a.prazo) === 'atrasada').length
}
