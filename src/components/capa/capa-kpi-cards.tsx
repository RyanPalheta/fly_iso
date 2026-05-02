import { ClipboardList, Clock, CheckCircle2, AlertOctagon } from 'lucide-react'
import type { CapaStats } from '@/lib/queries/capas'

interface CapaKpiCardsProps { stats: CapaStats }

export function CapaKpiCards({ stats }: Readonly<CapaKpiCardsProps>) {
  const taxaEnc = stats.total > 0 ? Math.round((stats.encerradas / stats.total) * 100) : 0

  const cards = [
    {
      label: 'Total Abertas',
      value: stats.abertas,
      icon: ClipboardList,
      iconCls: 'text-blue-600',
      bg: 'bg-blue-50',
      footer: <span className="text-xs text-slate-500">{stats.total} no total</span>,
    },
    {
      label: 'Em Execução',
      value: stats.emExecucao,
      icon: Clock,
      iconCls: 'text-amber-600',
      bg: 'bg-amber-50',
      footer: <span className="text-xs text-slate-500">plano definido / execução</span>,
    },
    {
      label: 'Vencidas',
      value: stats.vencidas,
      icon: AlertOctagon,
      iconCls: stats.vencidas > 0 ? 'text-red-600' : 'text-slate-400',
      bg: stats.vencidas > 0 ? 'bg-red-50' : 'bg-slate-50',
      footer: stats.vencidas > 0
        ? <span className="text-xs text-red-600 font-semibold">Prazo ultrapassado</span>
        : <span className="text-xs text-emerald-600 font-semibold">Todos no prazo</span>,
    },
    {
      label: 'Taxa de Encerramento',
      value: `${taxaEnc}%`,
      icon: CheckCircle2,
      iconCls: 'text-emerald-600',
      bg: 'bg-emerald-50',
      progress: taxaEnc,
      footer: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c) => (
        <div key={c.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium text-sm">{c.label}</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
              <c.icon className={`h-5 w-5 ${c.iconCls}`} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{c.value}</div>
            {c.progress !== undefined ? (
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${c.progress}%` }} />
              </div>
            ) : (
              <div className="mt-1">{c.footer}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
