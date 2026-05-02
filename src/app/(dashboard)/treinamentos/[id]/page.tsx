import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TreinamentoDetail } from '@/components/treinamentos/treinamento-detail'
import { getTreinamento } from '@/lib/queries/treinamentos'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const t = await getTreinamento(id)
  return { title: t ? `${t.titulo} | Fly ISO` : 'Treinamento | Fly ISO' }
}

export default async function TreinamentoDetailPage({ params }: Props) {
  const { id } = await params
  const treinamento = await getTreinamento(id)
  if (!treinamento) notFound()
  return <TreinamentoDetail treinamento={treinamento} />
}
