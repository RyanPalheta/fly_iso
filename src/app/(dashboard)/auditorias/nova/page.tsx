import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listChecklists } from '@/lib/queries/auditorias'
import { listAreasComUnidade, listUsuariosAtivos } from '@/lib/queries/areas'
import { AuditoriaForm } from '@/components/auditorias/auditoria-form'

export const metadata: Metadata = { title: 'Nova Auditoria | Fly ISO' }

export default async function NovaAuditoriaPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const [checklists, areas, usuarios] = await Promise.all([
    listChecklists({ somenteAtivos: true }),
    listAreasComUnidade(),
    listUsuariosAtivos(),
  ])

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/auditorias" className="hover:text-blue-700 transition-colors">Auditorias</Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Nova Auditoria</span>
      </nav>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nova Auditoria</h1>
        <p className="text-sm text-slate-500 mt-1">
          Programe uma auditoria interna, 5S, de fornecedor ou de segurança
        </p>
      </div>

      <AuditoriaForm checklists={checklists} areas={areas} usuarios={usuarios} />
    </div>
  )
}
