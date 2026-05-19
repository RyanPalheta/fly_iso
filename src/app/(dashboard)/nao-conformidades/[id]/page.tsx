import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { NCDetail } from '@/components/nc/nc-detail'
import { getNC } from '@/lib/queries/nao-conformidades'
import { listarComentariosNC } from '@/lib/queries/nc-comentarios'
import { createClient } from '@/lib/supabase/server'

interface NCDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: NCDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const nc = await getNC(id)
  return { title: nc ? `${nc.codigo} — ${nc.titulo} | Fly ISO` : 'NC | Fly ISO' }
}

export default async function NCDetailPage({ params }: NCDetailPageProps) {
  const { id } = await params

  // Em paralelo: NC + comentários + perfil do usuário atual
  const supabase = await createClient()
  const [nc, comentarios, { data: { user } }] = await Promise.all([
    getNC(id),
    listarComentariosNC(id),
    supabase.auth.getUser(),
  ])
  if (!nc) notFound()
  if (!user) redirect('/login')

  // Nome do usuário atual (para exibir no form de comentário)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('usuarios')
    .select('nome')
    .eq('id', user.id)
    .single()
  const usuarioAtualNome = (profile as { nome: string } | null)?.nome ?? user.email ?? 'Usuário'

  return (
    <NCDetail
      nc={nc}
      comentarios={comentarios}
      usuarioAtualId={user.id}
      usuarioAtualNome={usuarioAtualNome}
    />
  )
}
