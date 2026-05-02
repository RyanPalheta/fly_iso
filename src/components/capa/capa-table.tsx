'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CapaComRelacoes } from '@/lib/queries/capas'
import type { CapaStatus } from '@/types/database'

const STATUS_META: Record<CapaStatus, { label: string; cls: string }> = {
  aberta:           { label: 'Aberta',          cls: 'bg-sky-100 text-sky-700' },
  em_investigacao:  { label: 'Investigando',     cls: 'bg-blue-100 text-blue-700' },
  plano_definido:   { label: 'Plano Definido',   cls: 'bg-indigo-100 text-indigo-700' },
  em_execucao:      { label: 'Em Execução',      cls: 'bg-amber-100 text-amber-700' },
  verificacao:      { label: 'Verificação',      cls: 'bg-violet-100 text-violet-700' },
  encerrada:        { label: 'Encerrada',        cls: 'bg-emerald-100 text-emerald-700' },
  reaberta:         { label: 'Reaberta',         cls: 'bg-rose-100 text-rose-700' },
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isVencida(prazo: string | null, status: CapaStatus): boolean {
  if (!prazo || status === 'encerrada') return false
  return prazo < new Date().toISOString().split('T')[0]
}

interface CapaTableProps { capas: CapaComRelacoes[] }

export function CapaTable({ capas }: Readonly<CapaTableProps>) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = capas.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.codigo.toLowerCase().includes(q) ||
      (c.descricao ?? '').toLowerCase().includes(q) ||
      (c.nc?.codigo ?? '').toLowerCase().includes(q) ||
      (c.responsavel?.nome ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, NC, responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-72"
          />
        </div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          {filtered.length} de {capas.length} resultados
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              {['Código', 'NC Vinculada', 'Tipo', 'Descrição', 'Responsável', 'Prazo', 'Status'].map((col) => (
                <th key={col} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((capa) => {
              const st = STATUS_META[capa.status]
              const vencida = isVencida(capa.prazo_geral, capa.status)
              return (
                <tr
                  key={capa.id}
                  onClick={() => router.push(`/capa/${capa.id}`)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-5 font-mono text-sm text-blue-700 font-bold whitespace-nowrap">
                    {capa.codigo}
                  </td>
                  <td className="px-6 py-5">
                    {capa.nc ? (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold">
                        {capa.nc.codigo}
                      </span>
                    ) : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap',
                      capa.tipo === 'corretiva' ? 'bg-orange-100 text-orange-700' : 'bg-violet-100 text-violet-700'
                    )}>
                      {capa.tipo === 'corretiva' ? 'Corretiva' : 'Preventiva'}
                    </span>
                  </td>
                  <td className="px-6 py-5 min-w-[240px]">
                    <p className="text-sm text-slate-800 line-clamp-2">{capa.descricao ?? '—'}</p>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-700 whitespace-nowrap">
                    {capa.responsavel?.nome ?? '—'}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={cn('text-xs font-semibold', vencida ? 'text-red-600' : 'text-slate-500')}>
                      {vencida && '⚠ '}{fmt(capa.prazo_geral)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap', st.cls)}>
                      {st.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-slate-400 text-sm">
                  Nenhuma CAPA encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Exibindo <span className="font-bold text-slate-900">{filtered.length}</span> CAPAs
        </p>
        <div className="flex items-center gap-2">
          <button disabled className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 disabled:cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-blue-700 text-blue-700 font-bold text-xs shadow-sm">1</button>
          <button disabled className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 disabled:cursor-not-allowed">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => router.push('/capa/nova')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-30"
        aria-label="Nova CAPA"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
