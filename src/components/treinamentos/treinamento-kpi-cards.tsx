import { BookOpen, Calendar, CheckCircle2, XCircle, Users2 } from 'lucide-react'
import type { TreinamentoStats } from '@/lib/queries/treinamentos'

interface Props { stats: TreinamentoStats }

export function TreinamentoKpiCards({ stats }: Readonly<Props>) {
  const cards = [
    { label: 'Total de Treinamentos', value: stats.total,      sub: 'cadastrados',          icon: BookOpen,      bg: 'bg-blue-50',    iconBg: 'bg-blue-100',    iconC: 'text-blue-700',    textC: 'text-blue-700' },
    { label: 'Planejados',            value: stats.planejados,  sub: 'aguardando execução',  icon: Calendar,      bg: 'bg-violet-50',  iconBg: 'bg-violet-100',  iconC: 'text-violet-700',  textC: 'text-violet-700' },
    { label: 'Realizados',            value: stats.realizados,  sub: 'concluídos',           icon: CheckCircle2,  bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconC: 'text-emerald-700', textC: 'text-emerald-700' },
    { label: 'Cancelados',            value: stats.cancelados,  sub: 'não realizados',       icon: XCircle,       bg: 'bg-red-50',     iconBg: 'bg-red-100',     iconC: 'text-red-700',     textC: 'text-red-700' },
    { label: 'Taxa de Conclusão',     value: `${stats.taxa_conclusao}%`, sub: 'dos participantes',  icon: Users2,  bg: 'bg-amber-50',   iconBg: 'bg-amber-100',   iconC: 'text-amber-700',   textC: 'text-amber-700' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(({ label, value, sub, icon: Icon, bg, iconBg, iconC, textC }) => (
        <div key={label} className={`${bg} rounded-2xl p-4 ring-1 ring-black/5`}>
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
            <Icon className={`h-4 w-4 ${iconC}`} />
          </div>
          <div className={`text-2xl font-extrabold ${textC}`}>{value}</div>
          <div className="text-xs font-bold text-slate-700 mt-0.5">{label}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
        </div>
      ))}
    </div>
  )
}
