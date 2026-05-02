'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { Plus, BookOpen, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateTreinamentoStatus } from '@/lib/actions/treinamentos'
import type { TreinamentoComRelacoes } from '@/lib/queries/treinamentos'

interface Props { treinamentos: TreinamentoComRelacoes[] }

const STATUS_META = {
  planejado: { label: 'Planejado',  cls: 'bg-violet-100 text-violet-700',  icon: Clock },
  realizado:  { label: 'Realizado',  cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelado:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-700',         icon: XCircle },
}

const TIPO_LABEL: Record<string, string> = {
  presencial: 'Presencial',
  online:     'Online',
  leitura:    'Leitura',
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusSelect({ id, status }: Readonly<{ id: string; status: string }>) {
  const [, start] = useTransition()
  const statuses: Array<'planejado' | 'realizado' | 'cancelado'> = ['planejado', 'realizado', 'cancelado']
  return (
    <select
      value={status}
      onChange={(e) => {
        const next = e.target.value as 'planejado' | 'realizado' | 'cancelado'
        start(async () => { await updateTreinamentoStatus(id, next) })
      }}
      className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white cursor-pointer"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>{STATUS_META[s].label}</option>
      ))}
    </select>
  )
}

export function TreinamentoTable({ treinamentos }: Readonly<Props>) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Treinamentos</h2>
          <p className="text-xs text-slate-500 mt-0.5">{treinamentos.length} treinamento(s)</p>
        </div>
        <Link
          href="/treinamentos/novo"
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Treinamento
        </Link>
      </div>

      {treinamentos.length === 0 ? (
        <div className="py-20 text-center">
          <BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Nenhum treinamento cadastrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Status', 'Título', 'Tipo', 'Área', 'Data', 'Participantes', 'Ações'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 first:pl-6 last:pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {treinamentos.map((t) => {
                const meta = STATUS_META[t.status as keyof typeof STATUS_META] ?? STATUS_META.planejado
                const Icon = meta.icon
                const participantes = t.treinamento_participantes ?? []
                const concluidos    = participantes.filter((p) => p.status === 'concluido').length

                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 pl-6">
                      <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit', meta.cls)}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/treinamentos/${t.id}`} className="font-semibold text-slate-900 hover:text-blue-700 transition-colors">
                        {t.titulo}
                      </Link>
                      {t.instrutor && (
                        <p className="text-xs text-slate-400 mt-0.5">Instrutor: {t.instrutor}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {TIPO_LABEL[t.tipo] ?? t.tipo}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {t.areas?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {fmtDate(t.data_treinamento)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {participantes.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-slate-900">{concluidos}/{participantes.length}</span>
                          <span className="text-slate-400">concluídos</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 pr-6">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/treinamentos/${t.id}`}
                          className="px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Ver
                        </Link>
                        <StatusSelect id={t.id} status={t.status} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
