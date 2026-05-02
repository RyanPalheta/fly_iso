import { TrendingUp, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'
import type { IndicadorStats } from '@/lib/queries/indicadores'

interface IndicadorKpiCardsProps {
  stats: IndicadorStats
}

export function IndicadorKpiCards({ stats }: Readonly<IndicadorKpiCardsProps>) {
  const cards = [
    {
      label: 'Total de Indicadores',
      value: stats.total,
      sub: `${stats.ativos} ativos`,
      icon: TrendingUp,
      color: 'blue',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      textColor: 'text-blue-700',
    },
    {
      label: 'No Verde',
      value: stats.no_verde,
      sub: '≥ 95% da meta',
      icon: CheckCircle2,
      color: 'emerald',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      textColor: 'text-emerald-700',
    },
    {
      label: 'Atenção',
      value: stats.no_amarelo,
      sub: '80–95% da meta',
      icon: AlertTriangle,
      color: 'amber',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      textColor: 'text-amber-700',
    },
    {
      label: 'Críticos',
      value: stats.no_vermelho,
      sub: '< 80% da meta',
      icon: XCircle,
      color: 'red',
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-700',
      textColor: 'text-red-700',
    },
    {
      label: 'Sem Resultado',
      value: stats.sem_resultado,
      sub: 'Aguardando lançamento',
      icon: HelpCircle,
      color: 'slate',
      bg: 'bg-slate-50',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      textColor: 'text-slate-700',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(({ label, value, sub, icon: Icon, bg, iconBg, iconColor, textColor }) => (
        <div key={label} className={`${bg} rounded-2xl p-4 ring-1 ring-black/5`}>
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
            <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
          </div>
          <div className={`text-2xl font-extrabold ${textColor}`}>{value}</div>
          <div className="text-xs font-bold text-slate-700 mt-0.5">{label}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
        </div>
      ))}
    </div>
  )
}
