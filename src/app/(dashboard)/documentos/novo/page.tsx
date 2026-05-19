import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DocumentForm } from '@/components/documentos/document-form'
import { listAreasComUnidade, listUsuariosAtivos } from '@/lib/queries/areas'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Novo Documento | Fly ISO' }

export default async function NovoDocumentoPage() {
  const supabase = await createClient()
  const [areas, usuarios, { data: { user } }] = await Promise.all([
    listAreasComUnidade(),
    listUsuariosAtivos(),
    supabase.auth.getUser(),
  ])

  if (!user) redirect('/login')

  return (
    <DocumentForm
      areas={areas}
      usuarios={usuarios}
      usuarioAtualId={user.id}
    />
  )
}
