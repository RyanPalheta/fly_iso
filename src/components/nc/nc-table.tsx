'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, ArrowDownNarrowWide, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import type { NCComRelacoes } from '@/lib/queries/nao-conformidades'
import type { NCSeveridade, NCStatus, NCOrigem } from '@/types/database'
import { cn } from '@/lib/utils'

const GRAVIDADE_STYLES: Record<NCSeveridade, { pill: string; dot: string; label: string }> = {
  menor:   { pill: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-500',  label: 'MENOR' },
  maior:   { pill: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-500',  label: 'MAIOR' },
  critica: { pill: 'bg-red-100 text-red-700',        dot: 'bg-red-500',     label: 'CRÍTICA' },
}

const STATUS_LABEL: Record<NCStatus, { label: string; cls: string }> = {
  registrada:  { label: 'Aberta',        cls: 'bg-sky-100 text-sky-700' },
  em_analise:  { label: 'Em Análise',    cls: 'bg-blue-100 text-blue-700' },
  em_acao:     { label: 'Em Ação',       cls: 'bg-indigo-100 text-indigo-700' },
  verificacao: { label: 'Verificação',   cls: 'bg-violet-100 text-violet-700' },
  encerrada:   { label: 'Encerrada',     cls: 'bg-emerald-100 text-emerald-700' },
}

const ORIGEM_LABEL: Record<NCOrigem, string> = {
  auditoria_interna: 'Auditoria Int.',
  auditoria_externa: 'Auditoria Ext.',
  cliente: 'Cliente',
  processo: 'Processo',
  indicador: 'Indicador',
}

// Cores estáveis para avatar por iniciais
const AVATAR_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
]

function initials(nome: string | null | undefined): string {
  if (!nome) return '—'
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function avatarColor(nome: string | null | undefined): string {
  if (!nome) return 'bg-slate-100 text-slate-600'
  const idx = nome.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[idx]
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface NCTableProps {
  ncs: NCComRelacoes[]
}

export function NCTable({ ncs }: Readonly<NCTableProps>) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = ncs.filter((nc) => {
    const q = search.toLowerCase()
    const area = nc.areas?.nome ?? ''
    return (
      nc.titulo.toLowerCase().includes(q) ||
      nc.codigo.toLowerCase().includes(q) ||
      area.toLowerCase().includes(q)
    )
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg text-sm font-medium text-slate-700">
            <Filter className="h-4 w-4" />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg text-sm font-medium text-slate-700">
            <ArrowDownNarrowWide className="h-4 w-4" />
            Mais Recentes Primeiro
          </button>
          <div className="relative ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar NC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-56"
            />
          </div>
        </div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          Mostrando 1–{filtered.length} de {ncs.length} resultados
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              {['Código', 'Título', 'Origem', 'Gravidade', 'Área / Unidade', 'Responsável', 'Status', 'Data'].map(
                (col) => (
                  <th
                    key={col}
                    className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filtered.map((nc) => {
              const g = nc.severidade ? GRAVIDADE_STYLES[nc.severidade] : null
              const st = STATUS_LABEL[nc.status]
              const responsavelNome = nc.responsavel?.nome ?? null
              return (
                <tr
                  key={nc.id}
                  onClick={() => router.push(`/nao-conformidades/${nc.id}`)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-5 font-mono text-sm text-blue-700 font-bold whitespace-nowrap">
                    {nc.codigo}
                  </td>
                  <td className="px-6 py-5 min-w-[240px]">
                    <div className="text-sm font-semibold text-slate-900">{nc.titulo}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{nc.descricao}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap">
                      {nc.origem ? ORIGEM_LABEL[nc.origem] : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {g ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap',
                          g.pill
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', g.dot)} />
                        {g.label}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-semibold text-slate-900">{nc.areas?.nome ?? '—'}</div>
                    <div className="text-[10px] text-slate-400">{nc.areas?.unidades?.nome ?? ''}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                          avatarColor(responsavelNome)
                        )}
                      >
                        {initials(responsavelNome)}
                      </div>
                      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                        {responsavelNome ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold uppercase whitespace-nowrap', st.cls)}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-500 font-medium whitespace-nowrap">
                    {fmt(nc.created_at)}
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center">
                  <p className="text-slate-400 text-sm font-medium">Nenhuma NC encontrada.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Resultados por página <span className="font-bold text-slate-900">25</span>
        </p>
        <div className="flex items-center gap-2">
          <button disabled className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-500">Página 1 de 5</span>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white transition-all">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Floating + button */}
      <button
        onClick={() => router.push('/nao-conformidades/nova')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-30"
        aria-label="Nova NC"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
