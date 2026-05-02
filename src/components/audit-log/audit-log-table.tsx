'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACAO_META, ENTIDADE_LABEL, ENTIDADES, ACOES } from '@/lib/queries/audit-log-types'
import type { AuditLogComUsuario, UsuarioBasicoAudit } from '@/lib/queries/audit-log-types'

interface AuditLogTableProps {
  rows:      AuditLogComUsuario[]
  total:     number
  limit:     number
  offset:    number
  usuarios:  UsuarioBasicoAudit[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function AuditLogTable({ rows, total, limit, offset, usuarios }: Readonly<AuditLogTableProps>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Local filter state synced with URL
  const [entidade,  setEntidade]  = useState(searchParams.get('entidade') ?? '')
  const [acao,      setAcao]      = useState(searchParams.get('acao') ?? '')
  const [usuarioId, setUsuarioId] = useState(searchParams.get('usuario') ?? '')
  const [de,        setDe]        = useState(searchParams.get('de') ?? '')
  const [ate,       setAte]       = useState(searchParams.get('ate') ?? '')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const applyFilters = (overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams()
    const vals: Record<string, string> = {
      entidade, acao, usuario: usuarioId, de, ate, offset: '0', ...overrides,
    }
    Object.entries(vals).forEach(([k, v]) => { if (v) params.set(k, v) })
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const page    = Math.floor(offset / limit) + 1
  const pages   = Math.ceil(total / limit)
  const hasPrev = offset > 0
  const hasNext = offset + limit < total

  const goPage = (dir: 1 | -1) => {
    applyFilters({ offset: String(Math.max(0, offset + dir * limit)) })
  }

  const selectCls = 'text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white text-slate-700'

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entidade</label>
          <select value={entidade} onChange={e => setEntidade(e.target.value)} className={selectCls}>
            <option value="">Todas</option>
            {ENTIDADES.map(e => (
              <option key={e} value={e}>{ENTIDADE_LABEL[e] ?? e}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ação</label>
          <select value={acao} onChange={e => setAcao(e.target.value)} className={selectCls}>
            <option value="">Todas</option>
            {ACOES.map(a => (
              <option key={a} value={a}>{ACAO_META[a]?.label ?? a}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Usuário</label>
          <select value={usuarioId} onChange={e => setUsuarioId(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)}
            className={`${selectCls} w-36`} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)}
            className={`${selectCls} w-36`} />
        </div>
        <button
          type="button"
          onClick={() => applyFilters()}
          className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          Filtrar
        </button>
        {(entidade || acao || usuarioId || de || ate) && (
          <button
            type="button"
            onClick={() => { setEntidade(''); setAcao(''); setUsuarioId(''); setDe(''); setAte(''); applyFilters({ entidade:'', acao:'', usuario:'', de:'', ate:'' }) }}
            className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-2 hover:bg-red-50 rounded-xl transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Audit Log Global</h2>
            <p className="text-xs text-slate-500 mt-0.5">{total} evento{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Página {page}/{Math.max(pages, 1)}</span>
        </div>

        {rows.length === 0 ? (
          <div className="py-20 text-center">
            <Activity className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-500">Nenhum evento encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Quando', 'Usuário', 'Ação', 'Entidade', 'ID do Registro', 'Detalhes'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 first:pl-6 last:pr-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const meta = ACAO_META[row.acao] ?? { label: row.acao, cls: 'bg-slate-100 text-slate-600' }
                  const isExpanded = expandedId === row.id
                  return (
                    <>
                      <tr
                        key={row.id}
                        className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                      >
                        <td className="px-4 py-3 pl-6 text-xs text-slate-500 whitespace-nowrap">
                          {fmtDate(row.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {row.usuario ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {initials(row.usuario.nome)}
                              </div>
                              <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                                {row.usuario.nome}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sistema</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', meta.cls)}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-700">
                          {ENTIDADE_LABEL[row.entidade] ?? row.entidade}
                        </td>
                        <td className="px-4 py-3">
                          {row.entidade_id ? (
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                              {row.entidade_id.slice(0, 8)}…
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 pr-6">
                          {(row.dados_anteriores || row.dados_novos) ? (
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : row.id) }}
                              className="text-[10px] font-bold text-blue-700 hover:underline"
                            >
                              {isExpanded ? 'Fechar ▲' : 'Ver diff ▼'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (row.dados_anteriores || row.dados_novos) && (
                        <tr key={`${row.id}-diff`} className="bg-slate-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              {row.dados_anteriores && (
                                <div>
                                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2">Antes</p>
                                  <pre className="text-[10px] bg-red-50 text-red-800 p-3 rounded-xl overflow-auto max-h-40 leading-relaxed">
                                    {JSON.stringify(row.dados_anteriores, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {row.dados_novos && (
                                <div>
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Depois</p>
                                  <pre className="text-[10px] bg-emerald-50 text-emerald-800 p-3 rounded-xl overflow-auto max-h-40 leading-relaxed">
                                    {JSON.stringify(row.dados_novos, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Exibindo <span className="font-bold text-slate-900">{offset + 1}–{Math.min(offset + limit, total)}</span> de{' '}
              <span className="font-bold text-slate-900">{total}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={!hasPrev}
                onClick={() => goPage(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">{page} / {pages}</span>
              <button
                disabled={!hasNext}
                onClick={() => goPage(1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
