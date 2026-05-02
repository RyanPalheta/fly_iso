'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { NCKanbanData, NCAgrupadaStatus } from '@/lib/queries/nc'

interface Props { data: NCKanbanData }

const COLUMNS: Array<{
  key: keyof NCKanbanData
  label: string
  color: string
  headerCls: string
  dotCls: string
}> = [
  { key: 'registrada',  label: 'Registrada',   color: 'slate',   headerCls: 'bg-slate-50 border-slate-200',   dotCls: 'bg-slate-400' },
  { key: 'em_analise',  label: 'Em Análise',    color: 'blue',    headerCls: 'bg-blue-50 border-blue-200',     dotCls: 'bg-blue-500' },
  { key: 'em_acao',     label: 'CAPA Iniciada', color: 'amber',   headerCls: 'bg-amber-50 border-amber-200',   dotCls: 'bg-amber-500' },
  { key: 'verificacao', label: 'Verificação',   color: 'purple',  headerCls: 'bg-purple-50 border-purple-200', dotCls: 'bg-purple-500' },
  { key: 'encerrada',   label: 'Encerrada',     color: 'emerald', headerCls: 'bg-emerald-50 border-emerald-200', dotCls: 'bg-emerald-500' },
]

const SEVERIDADE_CLS: Record<string, string> = {
  critica: 'bg-red-100 text-red-700',
  maior:   'bg-orange-100 text-orange-700',
  menor:   'bg-sky-100 text-sky-700',
}

export function NCKanban({ data }: Readonly<Props>) {
  const total = Object.values(data).reduce((s, col) => s + col.length, 0)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Kanban — Status das Não Conformidades</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">{total} NC{total !== 1 ? 's' : ''} ativas nos últimos 30 dias</p>
        </div>
        <Link
          href="/nao-conformidades"
          className="text-[11px] font-bold text-blue-700 hover:underline"
        >
          Ver lista completa →
        </Link>
      </div>

      {/* Board */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto">
        {COLUMNS.map(({ key, label, headerCls, dotCls }) => {
          const cards = data[key]
          return (
            <div key={key} className="min-w-[180px]">
              {/* Column header */}
              <div className={cn('flex items-center justify-between px-3 py-2 rounded-xl border mb-2', headerCls)}>
                <div className="flex items-center gap-2">
                  <span className={cn('w-2.5 h-2.5 rounded-full', dotCls)} />
                  <span className="text-[11px] font-bold text-slate-700">{label}</span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-500">{cards.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {cards.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-slate-100 py-6 flex items-center justify-center">
                    <p className="text-[10px] text-slate-300 font-bold">Vazio</p>
                  </div>
                )}
                {cards.slice(0, 6).map((nc) => (
                  <NCCard key={nc.id} nc={nc} />
                ))}
                {cards.length > 6 && (
                  <Link
                    href="/nao-conformidades"
                    className="block text-center text-[10px] font-bold text-blue-600 py-2 hover:underline"
                  >
                    +{cards.length - 6} mais
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NCCard({ nc }: Readonly<{ nc: NCAgrupadaStatus }>) {
  const severCls = SEVERIDADE_CLS[nc.severidade] ?? 'bg-slate-100 text-slate-600'
  const age = Math.floor((Date.now() - new Date(nc.created_at).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Link href={`/nao-conformidades/${nc.id}`}>
      <div className="bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
        {/* Code + severity */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 font-mono">{nc.codigo}</span>
          <span className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase', severCls)}>
            {nc.severidade}
          </span>
        </div>

        {/* Title */}
        <p className="text-[11px] font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {nc.titulo}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
          {nc.area && (
            <span className="text-[9px] text-slate-400 font-medium truncate max-w-[80px]">{nc.area}</span>
          )}
          <span className="text-[9px] text-slate-400 font-medium ml-auto">
            {age === 0 ? 'Hoje' : age === 1 ? '1 dia' : `${age}d`}
          </span>
        </div>
      </div>
    </Link>
  )
}
