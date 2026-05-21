import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { TreinamentoForm } from '@/components/treinamentos/treinamento-form'
import { listAreasComUnidade, listUsuariosAtivos } from '@/lib/queries/areas'
import { listDocumentosVigentes } from '@/lib/queries/documentos'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Novo Treinamento | Fly ISO' }

export default async function NovoTreinamentoPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const [areas, usuarios, documentos] = await Promise.all([
    listAreasComUnidade(),
    listUsuariosAtivos(),
    listDocumentosVigentes(),
  ])

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/treinamentos" className="hover:text-blue-700 transition-colors">Treinamentos</Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Novo Treinamento</span>
      </nav>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Novo Treinamento</h1>
        <p className="text-sm text-slate-500 mt-1">
          Capacitação interna (vinculada a documento) ou externa (curso/certificação)
        </p>
      </div>
      <TreinamentoForm
        areas={areas}
        usuarios={usuarios}
        documentos={documentos}
      />
    </div>
  )
}
