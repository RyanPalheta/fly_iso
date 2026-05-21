import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, ExternalLink, ChevronRight } from 'lucide-react'
import { TreinamentoKpiCards } from '@/components/treinamentos/treinamento-kpi-cards'
import { TreinamentoTable } from '@/components/treinamentos/treinamento-table'
import { listTreinamentos, getTreinamentoStats } from '@/lib/queries/treinamentos'
import type { TreinamentoCategoria } from '@/types/database'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Treinamentos | Fly ISO' }

interface Props {
  searchParams: Promise<{ tipo?: string }>
}

export default async function TreinamentosPage({ searchParams }: Props) {
  const sp = await searchParams
  const categoria: TreinamentoCategoria | undefined =
    sp.tipo === 'externo' ? 'externo' : sp.tipo === 'interno' ? 'interno' : undefined

  const [treinamentos, stats] = await Promise.all([
    listTreinamentos({ categoria }),
    getTreinamentoStats(),
  ])

  const tabs: Array<{
    key:   'todos' | 'interno' | 'externo'
    label: string
    desc:  string
    href:  string
    icon:  React.ElementType
    count: number
  }> = [
    { key: 'todos',   label: 'Todos',     desc: 'Visão geral',                          href: '/treinamentos',                icon: Users,        count: stats.total },
    { key: 'interno', label: 'Internos',  desc: 'Vinculados a documentos do SGQ',       href: '/treinamentos?tipo=interno',   icon: Users,        count: stats.internos },
    { key: 'externo', label: 'Externos',  desc: 'Cursos externos + LNT + plano anual',  href: '/treinamentos?tipo=externo',   icon: ExternalLink, count: stats.externos },
  ]
  const ativo = sp.tipo === 'interno' ? 'interno' : sp.tipo === 'externo' ? 'externo' : 'todos'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Treinamentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie capacitação interna (documentos do SGQ) e externa (cursos & certificações)
          </p>
        </div>
      </div>

      {/* Tabs segmentadas — Internos × Externos */}
      <div className="grid grid-cols-3 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = ativo === tab.key
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                'group rounded-2xl p-4 ring-1 transition-all',
                isActive
                  ? 'bg-blue-50 ring-blue-200 shadow-sm'
                  : 'bg-white ring-slate-100 hover:ring-slate-300'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center',
                  isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-500'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <ChevronRight className={cn(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-500'
                )} />
              </div>
              <div className="flex items-baseline gap-2">
                <p className={cn(
                  'text-sm font-bold',
                  isActive ? 'text-blue-900' : 'text-slate-800'
                )}>
                  {tab.label}
                </p>
                <span className={cn(
                  'text-xs font-extrabold tabular-nums',
                  isActive ? 'text-blue-600' : 'text-slate-400'
                )}>
                  {tab.count}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{tab.desc}</p>
            </Link>
          )
        })}
      </div>

      {/* KPIs (sempre mostram global) */}
      <TreinamentoKpiCards stats={stats} />

      {/* Lista filtrada pela tab ativa */}
      {treinamentos.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-12 text-center">
          <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">
            {categoria === 'interno' ? 'Nenhum treinamento interno cadastrado.' :
             categoria === 'externo' ? 'Nenhum treinamento externo cadastrado.' :
             'Nenhum treinamento cadastrado.'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Crie um novo treinamento para começar a registrar capacitações.
          </p>
        </div>
      ) : (
        <TreinamentoTable treinamentos={treinamentos} />
      )}
    </div>
  )
}
