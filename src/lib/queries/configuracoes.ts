import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

export type UnidadeComAreas = {
  id: string
  nome: string
  codigo: string | null
  ativa: boolean
  created_at: string
  areas: Array<{ id: string; nome: string }>
}

export type OrganizacaoStats = {
  totalUsuarios: number
  totalDocumentos: number
  totalNCs: number
  totalCAPAs: number
}

export async function listUnidadesComAreas(): Promise<UnidadeComAreas[]> {
  const sb = createServiceClient() as any

  const { data, error } = await sb
    .from('unidades')
    .select(`
      id, nome, codigo, ativa, created_at,
      areas ( id, nome )
    `)
    .order('nome', { ascending: true })

  if (error) {
    console.error('listUnidadesComAreas', error)
    return []
  }

  return (data ?? []) as UnidadeComAreas[]
}

export async function getOrganizacaoStats(): Promise<OrganizacaoStats> {
  const sb = createServiceClient() as any

  const [usuariosRes, documentosRes, ncsRes, capasRes] = await Promise.all([
    sb.from('usuarios').select('id', { count: 'exact', head: true }),
    sb.from('documentos').select('id', { count: 'exact', head: true }),
    sb.from('nao_conformidades').select('id', { count: 'exact', head: true }),
    sb.from('capas').select('id', { count: 'exact', head: true }),
  ])

  return {
    totalUsuarios:   usuariosRes.count  ?? 0,
    totalDocumentos: documentosRes.count ?? 0,
    totalNCs:        ncsRes.count       ?? 0,
    totalCAPAs:      capasRes.count     ?? 0,
  }
}
