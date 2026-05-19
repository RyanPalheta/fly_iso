import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocumentDetail } from '@/components/documentos/document-detail'
import { getDocumento, getVersoes } from '@/lib/queries/documentos'
import { listUnidadesComAreas } from '@/lib/queries/configuracoes'
import { listDistribuicoesDocumento } from '@/lib/queries/distribuicao'

interface DocumentoDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: DocumentoDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const doc = await getDocumento(id)
  return { title: doc ? `${doc.codigo} — ${doc.titulo} | Fly ISO` : 'Documento | Fly ISO' }
}

export default async function DocumentoDetailPage({ params }: DocumentoDetailPageProps) {
  const { id } = await params
  const [doc, versoes, unidades, distribuicoes] = await Promise.all([
    getDocumento(id),
    getVersoes(id),
    listUnidadesComAreas(),
    listDistribuicoesDocumento(id),
  ])
  if (!doc) notFound()

  return (
    <DocumentDetail
      doc={doc}
      versoes={versoes}
      unidades={unidades}
      distribuicoes={distribuicoes}
    />
  )
}
