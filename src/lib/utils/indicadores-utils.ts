/** Shared utility — no server-only import, safe to use in Client Components */

export function calcSemaforo(valor: number | null, meta: number | null): 'verde' | 'amarelo' | 'vermelho' | 'sem_dado' {
  if (valor === null || meta === null || meta === 0) return 'sem_dado'
  const pct = valor / meta
  if (pct >= 0.95) return 'verde'
  if (pct >= 0.80) return 'amarelo'
  return 'vermelho'
}
