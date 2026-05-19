import 'server-only'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Documento } from '@/types/database'

export type DocumentoComArea = Documento & {
  areas: { id: string; nome: string; unidades: { nome: string } | null } | null
  responsavel: { id: string; nome: string; email: string } | null
}

/**
 * Lista documentos com área + unidade + responsável.
 * RLS aplica: Admin/Qualidade vê tudo; outros veem da sua unidade.
 */
export async function listDocumentos(): Promise<DocumentoComArea[]> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('documentos')
    .select(`
      *,
      areas ( id, nome, unidades ( nome ) ),
      responsavel:usuarios!documentos_responsavel_id_fkey ( id, nome, email )
    `)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`Erro ao listar documentos: ${error.message}`)
  return (data ?? []) as unknown as DocumentoComArea[]
}

/**
 * Busca um documento por id com todos os relacionamentos.
 * Retorna null se não encontrado (ou sem permissão).
 */
export async function getDocumento(id: string): Promise<DocumentoComArea | null> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('documentos')
    .select(`
      *,
      areas ( id, nome, unidades ( nome ) ),
      responsavel:usuarios!documentos_responsavel_id_fkey ( id, nome, email )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`Erro ao buscar documento ${id}: ${error.message}`)
  return (data as unknown as DocumentoComArea | null) ?? null
}

/** Versões (histórico de revisões) do documento, mais recente primeiro. */
export async function getVersoes(documentoId: string) {
  // Service client: usuário já provou acesso ao documento via getDocumento().
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  const { data, error } = await sb
    .from('versoes')
    .select(`
      *,
      criador:usuarios!versoes_criado_por_fkey ( id, nome ),
      aprovador:usuarios!versoes_aprovado_por_fkey ( id, nome )
    `)
    .eq('documento_id', documentoId)
    .order('numero_revisao', { ascending: false })

  if (error) throw new Error(`Erro ao listar versões: ${error.message}`)
  return data ?? []
}

/** Busca por código (ex: "DOC-001"). */
export async function getDocumentoByCodigo(codigo: string) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('documentos')
    .select('*')
    .eq('codigo', codigo)
    .maybeSingle()

  if (error) throw new Error(`Erro ao buscar documento ${codigo}: ${error.message}`)
  return data
}
