import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NCDetail } from '@/components/nc/nc-detail'
import { getNC } from '@/lib/queries/nao-conformidades'

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
  const nc = await getNC(id)
  if (!nc) notFound()
  return <NCDetail nc={nc} />
}
