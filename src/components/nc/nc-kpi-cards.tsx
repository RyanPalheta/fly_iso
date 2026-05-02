import { TrendingDown, AlertOctagon, Link2, ShieldCheck } from 'lucide-react'
import type { NCStats } from '@/lib/queries/nao-conformidades'

interface NCKpiCardsProps {
  stats: NCStats
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function NCKpiCards({ stats }: Readonly<NCKpiCardsProps>) {
  const ativas = stats.total - stats.encerradas
  const taxaFechamento = stats.total > 0 ? Math.round((stats.encerradas / stats.total) * 100) : 0
  const aguardandoCapa = stats.porStatus.em_analise + stats.porStatus.em_acao

  const cards = [
    {
      label: 'Total de NCs Ativas',
      value: pad(ativas),
      icon: TrendingDown,
      iconColor: 'text-blue-700',
      footer: (
        <span className="text-xs text-slate-500 font-semibold">
          {stats.encerradas} encerradas no histórico
        </span>
      ),
    },
    {
      label: 'Gravidade Crítica',
      value: pad(stats.criticas),
      icon: AlertOctagon,
      iconColor: 'text-red-600',
      footer: stats.criticas > 0 ? (
        <span className="text-xs text-red-600 font-semibold">Requer Ação Imediata</span>
      ) : (
        <span className="text-xs text-emerald-600 font-semibold">Sem críticas abertas</span>
      ),
    },
    {
      label: 'Aguardando CAPA',
      value: pad(aguardandoCapa),
      icon: Link2,
      iconColor: 'text-slate-500',
      footer: <span className="text-xs text-slate-400 font-semibold">Investigação / ação em curso</span>,
    },
    {
      label: 'Taxa de Fechamento',
      value: `${taxaFechamento}%`,
      icon: ShieldCheck,
      iconColor: 'text-blue-700',
      progress: taxaFechamento,
      footer: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium text-sm">{card.label}</span>
            <card.icon className={`h-5 w-5 ${card.iconColor}`} />
          </div>
          <div className="mt-4">
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{card.value}</div>
            {card.progress !== undefined ? (
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-700 h-full rounded-full transition-all"
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            ) : (
              <div className="mt-1">{card.footer}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
