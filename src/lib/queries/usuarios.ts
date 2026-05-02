import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type PerfilRow = {
  id: string
  nome: string
  descricao: string | null
  permissoes: Record<string, string[]>
  created_at: string
}

export type UsuarioComPerfil = {
  id: string
  nome: string
  email: string
  perfil_id: string | null
  ativo: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
  perfis: PerfilRow | null
  usuario_unidades: Array<{
    unidades: { id: string; nome: string } | null
  }>
}

export type UnidadeRow = {
  id: string
  codigo: string
  nome: string
}

export async function listUsuariosCompleto(): Promise<UsuarioComPerfil[]> {
  const sb = await createClient()
  const { data, error } = await (sb as any)
    .from('usuarios')
    .select(`
      *,
      perfis ( id, nome, descricao ),
      usuario_unidades (
        unidades ( id, nome )
      )
    `)
    .order('nome', { ascending: true })

  if (error) { console.error('listUsuariosCompleto', error); return [] }
  return (data ?? []) as UsuarioComPerfil[]
}

export async function getPerfis(): Promise<PerfilRow[]> {
  const sb = await createClient()
  const { data, error } = await (sb as any).from('perfis').select('*').order('nome')
  if (error) return []
  return (data ?? []) as PerfilRow[]
}

export async function getUnidades(): Promise<UnidadeRow[]> {
  const sb = await createClient()
  const { data, error } = await (sb as any).from('unidades').select('*').order('nome')
  if (error) return []
  return (data ?? []) as UnidadeRow[]
}
