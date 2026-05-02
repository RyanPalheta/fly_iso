'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function marcarComoLida(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = (await createClient()) as any

  const { error } = await sb
    .from('notificacoes')
    .update({ lida: true })
    .eq('id', id)

  if (error) console.error('[marcarComoLida]', error.message)
  revalidatePath('/', 'layout')
}

export async function marcarTodasComoLidas(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = (await createClient()) as any
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return

  const { error } = await sb
    .from('notificacoes')
    .update({ lida: true })
    .eq('usuario_id', user.id)
    .eq('lida', false)

  if (error) console.error('[marcarTodasComoLidas]', error.message)
  revalidatePath('/', 'layout')
}

export async function criarNotificacao(input: {
  usuarioId: string
  titulo: string
  mensagem?: string
  tipo?: 'info' | 'alerta' | 'erro' | 'sucesso'
  entidade?: string
  entidadeId?: string
}): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  const { error } = await sb
    .from('notificacoes')
    .insert({
      usuario_id:  input.usuarioId,
      titulo:      input.titulo,
      mensagem:    input.mensagem ?? null,
      tipo:        input.tipo ?? 'info',
      entidade:    input.entidade ?? null,
      entidade_id: input.entidadeId ?? null,
    })

  if (error) console.error('[criarNotificacao]', error.message)
}
