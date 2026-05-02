import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { IndicadorDetail } from '@/components/indicadores/indicador-detail'
import { getIndicador, getResultados } from '@/lib/queries/indicadores'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const ind = await getIndicador(id)
  return { title: ind ? `${ind.nome} | Fly ISO` : 'Indicador | Fly ISO' }
}

export default async function IndicadorDetailPage({ params }: Props) {
  const { id } = await params
  const [indicador, resultados] = await Promise.all([
    getIndicador(id),
    getResultados(id),
  ])
  if (!indicador) notFound()
  return <IndicadorDetail indicador={indicador} resultados={resultados} />
}
