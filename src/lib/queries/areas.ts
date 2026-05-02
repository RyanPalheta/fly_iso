import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface AreaComUnidade {
  id: string
  nome: string
  unidade_id: string | null
  unidade: { id: string; nome: string } | null
}

export interface UsuarioBasico {
  id: string
  nome: string
  email: string
}

/** Áreas com a unidade pai — para selects do formulário. */
export async function listAreasComUnidade(): Promise<AreaComUnidade[]> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('areas')
    .select('id, nome, unidade_id, unidade:unidades(id, nome)')
    .order('nome')

  if (error) throw new Error(`Erro ao listar áreas: ${error.message}`)
  return (data ?? []) as unknown as AreaComUnidade[]
}

/** Usuários ativos — para o select de responsável. */
export async function listUsuariosAtivos(): Promise<UsuarioBasico[]> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('usuarios')
    .select('id, nome, email')
    .eq('ativo', true)
    .order('nome')

  if (error) throw new Error(`Erro ao listar usuários: ${error.message}`)
  return data ?? []
}
