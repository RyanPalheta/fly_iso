import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type { NotificacaoRow } from './notificacoes-types'
import type { NotificacaoRow } from './notificacoes-types'

export async function getNotificacoes(limit = 20): Promise<NotificacaoRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = (await createClient()) as any

  const { data, error } = await sb
    .from('notificacoes')
    .select('id, titulo, mensagem, tipo, lida, entidade, entidade_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) { console.error('[getNotificacoes]', error.message); return [] }
  return (data ?? []) as NotificacaoRow[]
}

export async function countUnreadNotificacoes(): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = (await createClient()) as any

  const { count, error } = await sb
    .from('notificacoes')
    .select('*', { count: 'exact', head: true })
    .eq('lida', false)

  if (error) { console.error('[countUnreadNotificacoes]', error.message); return 0 }
  return count ?? 0
}
