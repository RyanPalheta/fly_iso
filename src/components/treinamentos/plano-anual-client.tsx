'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Users2, Clock3, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LntRow } from '@/lib/queries/treinamento-lnt'
import type { AreaComUnidade } from '@/lib/queries/areas'
import type { LntStatus } from '@/types/database'

interface Props {
  itens:  LntRow[]
  areas:  AreaComUnidade[]
  ano:    number
}

const STATUS_CLS: Record<LntStatus, string> = {
  identificada: 'bg-slate-100 text-slate-600',
  aprovada:     'bg-blue-100 text-blue-700',
  planejada:    'bg-violet-100 text-violet-700',
  em_execucao:  'bg-amber-100 text-amber-700',
  concluida:    'bg-emerald-100 text-emerald-700',
  cancelada:    'bg-red-100 text-red-500',
}

const STATUS_LABEL: Record<LntStatus, string> = {
  identificada: 'Identificada',
  aprovada:     'Aprovada',
  planejada:    'Planejada',
  em_execucao:  'Em execução',
  concluida:    'Concluída',
  cancelada:    'Cancelada',
}

const PRIORIDADE_ORDER: Record<string, number> = { alta: 0, media: 1, baixa: 2 }

export function PlanoAnualClient({ itens, areas: _areas, ano }: Readonly<Props>) {
  const router = useRouter()
  const [anoLocal, setAnoLocal] = useState(ano)

  const goYear = (delta: number) => {
    const next = anoLocal + delta
    setAnoLocal(next)
    router.push(`/treinamentos/plano-anual?ano=${next}`)
  }

  // Group by area
  const areaMap = new Map<string, { nome: string; itens: LntRow[] }>()
  const semArea: LntRow[] = []

  for (const item of itens) {
    if (!item.area_id) { semArea.push(item); continue }
    if (!areaMap.has(item.area_id)) {
      areaMap.set(item.area_id, { nome: item.area?.nome ?? item.area_id, itens: [] })
    }
    areaMap.get(item.area_id)!.itens.push(item)
  }
  if (semArea.length) areaMap.set('__sem_area__', { nome: 'Sem área definida', itens: semArea })

  // Sort items within each group by prioridade then nome
  for (const g of areaMap.values()) {
    g.itens.sort((a, b) =>
      (PRIORIDADE_ORDER[a.prioridade] ?? 99) - (PRIORIDADE_ORDER[b.prioridade] ?? 99) ||
      a.treinamento_nome.localeCompare(b.treinamento_nome)
    )
  }

  // Global totals
  const totalItens    = itens.length
  const totalPessoas  = itens.reduce((s, i) => s + i.qtd_pessoas, 0)
  const totalHH       = itens.reduce((s, i) => s + (i.carga_horaria_estimada ?? 0) * i.qtd_pessoas, 0)
  const concluidas    = itens.filter((i) => i.status === 'concluida').length
  const pctConcluido  = totalItens > 0 ? Math.round((concluidas / totalItens) * 100) : 0

  // Count by status for progress bar
  const byStatus = (s: LntStatus) => itens.filter((i) => i.status === s).length

  return (
    <div className="space-y-6">
      {/* Year navigation */}
      <div className="flex items-center justify-center gap-4">
        <button type="button" onClick={() => goYear(-1)}
          className="p-2 rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50 text-slate-600">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-2xl font-extrabold text-slate-900 tabular-nums w-20 text-center">{anoLocal}</span>
        <button type="button" onClick={() => goYear(+1)}
          className="p-2 rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50 text-slate-600">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Necessidades',  value: totalItens,   icon: BarChart3,    cls: 'bg-blue-50 text-blue-700' },
          { label: 'Pessoas',       value: totalPessoas, icon: Users2,       cls: 'bg-violet-50 text-violet-700' },
          { label: 'H/H Totais',    value: totalHH,      icon: Clock3,       cls: 'bg-amber-50 text-amber-700' },
          { label: 'Concluídas',    value: concluidas,   icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-white rounded-2xl p-4 ring-1 ring-black/5 shadow-sm flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cls)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900 tabular-nums">{value}</p>
              <p className="text-[10px] text-slate-500 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {totalItens > 0 && (
        <div className="bg-white rounded-2xl p-5 ring-1 ring-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Progresso do Plano {anoLocal}</h3>
            <span className="text-sm font-extrabold text-slate-700">{pctConcluido}% concluído</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
            {(['concluida', 'em_execucao', 'planejada', 'aprovada', 'identificada', 'cancelada'] as LntStatus[]).map((s) => {
              const pct = (byStatus(s) / totalItens) * 100
              if (pct === 0) return null
              const colorMap: Record<LntStatus, string> = {
                concluida:    'bg-emerald-500',
                em_execucao:  'bg-amber-400',
                planejada:    'bg-violet-400',
                aprovada:     'bg-blue-400',
                identificada: 'bg-slate-200',
                cancelada:    'bg-red-300',
              }
              return (
                <div
                  key={s}
                  className={cn('h-full transition-all', colorMap[s])}
                  style={{ width: `${pct}%` }}
                  title={`${STATUS_LABEL[s]}: ${byStatus(s)}`}
                />
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {(['concluida', 'em_execucao', 'planejada', 'aprovada', 'identificada', 'cancelada'] as LntStatus[]).map((s) => {
              const count = byStatus(s)
              if (count === 0) return null
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-full', {
                    'bg-emerald-500': s === 'concluida',
                    'bg-amber-400':   s === 'em_execucao',
                    'bg-violet-400':  s === 'planejada',
                    'bg-blue-400':    s === 'aprovada',
                    'bg-slate-200':   s === 'identificada',
                    'bg-red-300':     s === 'cancelada',
                  })} />
                  <span className="text-[11px] text-slate-600">{STATUS_LABEL[s]}: <strong>{count}</strong></span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Groups by area */}
      {itens.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-black/5 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhuma necessidade para {anoLocal}.</p>
          <p className="text-xs text-slate-400 mt-1">
            Acesse o <a href="/treinamentos/lnt" className="text-blue-600 hover:underline">LNT</a> para identificar necessidades.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(areaMap.entries()).map(([areaId, group]) => {
            const hh = group.itens.reduce((s, i) => s + (i.carga_horaria_estimada ?? 0) * i.qtd_pessoas, 0)
            const pessoas = group.itens.reduce((s, i) => s + i.qtd_pessoas, 0)
            return (
              <div key={areaId} className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">{group.nome}</h3>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span><strong className="text-slate-700">{group.itens.length}</strong> necessidades</span>
                    <span><strong className="text-slate-700">{pessoas}</strong> pessoas</span>
                    {hh > 0 && <span><strong className="text-slate-700">{hh}</strong> H/H</span>}
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 py-2">Treinamento</th>
                      <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Prioridade</th>
                      <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Pessoas</th>
                      <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">H/H</th>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.itens.map((item) => {
                      const hh = (item.carga_horaria_estimada ?? 0) * item.qtd_pessoas
                      const priorCls: Record<string, string> = {
                        alta:  'bg-red-100 text-red-700',
                        media: 'bg-amber-100 text-amber-700',
                        baixa: 'bg-slate-100 text-slate-600',
                      }
                      return (
                        <tr key={item.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-900">{item.treinamento_nome}</p>
                            {item.justificativa && (
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{item.justificativa}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', priorCls[item.prioridade])}>
                              {item.prioridade === 'alta' ? 'Alta' : item.prioridade === 'media' ? 'Média' : 'Baixa'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-bold text-slate-700 tabular-nums">{item.qtd_pessoas}</td>
                          <td className="px-4 py-3 text-center text-xs font-bold text-slate-700 tabular-nums">{hh || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', STATUS_CLS[item.status])}>
                              {STATUS_LABEL[item.status]}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
