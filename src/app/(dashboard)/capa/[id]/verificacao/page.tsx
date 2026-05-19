import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { VerificacaoForm } from '@/components/capa/verificacao-form'
import { getCapa, getAcoes } from '@/lib/queries/capas'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Verificação de Eficácia | Fly ISO' }

export default async function VerificacaoPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const [capa, acoes, { data: { user } }] = await Promise.all([
    getCapa(id),
    getAcoes(id),
    supabase.auth.getUser(),
  ])

  if (!capa) notFound()
  if (!user) redirect('/login')

  return (
    <VerificacaoForm
      capa={{
        id:          capa.id,
        codigo:      capa.codigo,
        descricao:   capa.descricao,
        responsavel: capa.responsavel
          ? { id: capa.responsavel.id, nome: capa.responsavel.nome }
          : null,
        nc:          capa.nc ? { codigo: capa.nc.codigo, titulo: capa.nc.titulo } : null,
      }}
      acoes={acoes
        .filter((a) => a.status === 'concluida')
        .map((a) => ({
          id:             a.id,
          descricao:      a.descricao,
          prazo:          a.prazo,
          status:         a.status,
          concluida_em:   a.concluida_em,
          observacao:     a.observacao,
          evidencia_urls: a.evidencia_urls,
          responsavel:    a.responsavel ? { nome: a.responsavel.nome } : null,
        }))}
      usuarioAtualId={user.id}
    />
  )
}
