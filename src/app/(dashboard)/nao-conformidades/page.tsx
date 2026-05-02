import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { NCKpiCards } from '@/components/nc/nc-kpi-cards'
import { NCTable } from '@/components/nc/nc-table'
import { listNCs, getNCStats } from '@/lib/queries/nao-conformidades'

export const metadata: Metadata = {
  title: 'Lista de Não Conformidades | Fly ISO',
}

export default async function NaoConformidadesPage() {
  const [ncs, stats] = await Promise.all([listNCs(), getNCStats()])

  return (
    <div className="space-y-6">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/nao-conformidades/dashboard"
          className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Painel
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">Lista de NCs</span>
      </div>

      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Registro de Não Conformidades
          </h1>
          <p className="text-slate-500 max-w-2xl text-sm mt-1">
            Monitore e gerencie desvios dos requisitos especificados.
          </p>
        </div>
        <Link
          href="/nao-conformidades/dashboard"
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm"
        >
          <BarChart3 className="h-4 w-4 text-blue-700" />
          Painel Analítico
        </Link>
      </div>

      <NCKpiCards stats={stats} />
      <NCTable ncs={ncs} />
    </div>
  )
}
