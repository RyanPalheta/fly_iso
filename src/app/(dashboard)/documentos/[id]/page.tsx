import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocumentDetail } from '@/components/documentos/document-detail'
import { getDocumento, getVersoes } from '@/lib/queries/documentos'

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
  const [doc, versoes] = await Promise.all([getDocumento(id), getVersoes(id)])
  if (!doc) notFound()
  return <DocumentDetail doc={doc} versoes={versoes} />
}
