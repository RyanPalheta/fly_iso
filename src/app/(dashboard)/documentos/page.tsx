import type { Metadata } from 'next'
import { DocumentTable } from '@/components/documentos/document-table'
import { listDocumentos } from '@/lib/queries/documentos'

export const metadata: Metadata = {
  title: 'Controle de Documentos | Fly ISO',
  description: 'Gerencie toda a documentação oficial de qualidade e procedimentos operacionais.',
}

export default async function DocumentosPage() {
  const documentos = await listDocumentos()
  return <DocumentTable documentos={documentos} />
}
