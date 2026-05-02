import type { Metadata } from 'next'
import Link from 'next/link'
import { List, AlertTriangle, Settings2, CheckCircle2 } from 'lucide-react'
import { NCPareto } from '@/components/nc/nc-pareto'
import { NCKanban } from '@/components/nc/nc-kanban'
import { getNCKanbanData, getNCParetoData, getNCKPIs } from '@/lib/queries/nc'

export const metadata: Metadata = {
  title: 'Painel de Não Conformidades | Fly ISO',
}

export default async function NCDashboardPage() {
  const [kanbanData, paretoData, kpis] = await Promise.all([
    getNCKanbanData(),
    getNCParetoData(),
    getNCKPIs(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Não Conformidades</h1>
          <p className="text-sm text-slate-500 mt-1">Painel analítico — visão geral, Pareto e Kanban</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/nao-conformidades/nova"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            Nova NC
          </Link>
          <Link
            href="/nao-conformidades"
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm"
          >
            <List className="h-4 w-4 text-blue-700" />
            Lista Completa
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total de NCs"
          value={kpis.total}
          icon={AlertTriangle}
          iconBg="bg-slate-100 text-slate-600"
          sub="Histórico"
        />
        <KPICard
          label="NCs Abertas"
          value={kpis.abertas}
          icon={AlertTriangle}
          iconBg="bg-red-100 text-red-600"
          sub="Aguardando ação"
          valueColor="text-red-600"
        />
        <KPICard
          label="Em Tratamento"
          value={kpis.emTratamento}
          icon={Settings2}
          iconBg="bg-amber-100 text-amber-600"
          sub="CAPA / Verificação"
          valueColor="text-amber-600"
        />
        <KPICard
          label="Fechadas este Mês"
          value={kpis.fechadasMes}
          icon={CheckCircle2}
          iconBg="bg-emerald-100 text-emerald-600"
          sub="Últimos 30 dias"
          valueColor="text-emerald-600"
        />
      </div>

      {/* Pareto Chart */}
      <NCPareto data={paretoData} />

      {/* Kanban Board */}
      <NCKanban data={kanbanData} />
    </div>
  )
}

function KPICard({
  label, value, icon: Icon, iconBg, sub, valueColor = 'text-slate-900',
}: Readonly<{
  label: string
  value: number
  icon: React.ElementType
  iconBg: string
  sub: string
  valueColor?: string
}>) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`text-4xl font-extrabold tracking-tight ${valueColor}`}>{value}</p>
      <p className="text-[11px] text-slate-400 font-medium mt-1">{sub}</p>
    </div>
  )
}
