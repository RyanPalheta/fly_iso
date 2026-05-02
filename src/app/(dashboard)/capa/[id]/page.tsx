import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CapaDetail } from '@/components/capa/capa-detail'
import { getCapa, getAcoes } from '@/lib/queries/capas'
import { listUsuariosAtivos } from '@/lib/queries/areas'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const capa = await getCapa(id)
  return { title: capa ? `${capa.codigo} | Fly ISO` : 'CAPA | Fly ISO' }
}

export default async function CapaDetailPage({ params }: Props) {
  const { id } = await params
  const [capa, acoes, usuarios] = await Promise.all([
    getCapa(id),
    getAcoes(id),
    listUsuariosAtivos(),
  ])
  if (!capa) notFound()
  return <CapaDetail capa={capa} acoes={acoes} usuarios={usuarios} />
}
