import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type { ComentarioRow } from './nc-comentarios-types'
import type { ComentarioRow } from './nc-comentarios-types'

/** Lista comentários de uma NC, mais antigos primeiro (cronológico). */
export async function listarComentariosNC(ncId: string): Promise<ComentarioRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = (await createClient()) as any

  const { data, error } = await sb
    .from('nc_comentarios')
    .select(`
      id, nc_id, texto, editado, created_at, updated_at,
      usuario:usuarios!usuario_id ( id, nome, email, avatar_url )
    `)
    .eq('nc_id', ncId)
    .order('created_at', { ascending: true })

  if (error) { console.error('[listarComentariosNC]', error.message); return [] }
  return (data ?? []) as ComentarioRow[]
}
