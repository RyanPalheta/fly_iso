import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IndicadorForm } from '@/components/indicadores/indicador-form'
import { listAreasComUnidade, listUsuariosAtivos } from '@/lib/queries/areas'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Novo Indicador | Fly ISO' }

export default async function NovoIndicadorPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const [areas, usuarios] = await Promise.all([
    listAreasComUnidade(),
    listUsuariosAtivos(),
  ])

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/indicadores" className="hover:text-blue-700 transition-colors">Indicadores</Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Novo Indicador</span>
      </nav>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Novo Indicador</h1>
        <p className="text-sm text-slate-500 mt-1">Cadastre um novo KPI de desempenho ISO 9001</p>
      </div>

      <IndicadorForm areas={areas} usuarios={usuarios} />
    </div>
  )
}
