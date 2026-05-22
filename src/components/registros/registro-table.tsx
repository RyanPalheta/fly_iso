'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { Plus, Archive, CheckCircle2, Trash2, FolderOpen, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateRegistroStatus } from '@/lib/actions/registros'
import type { RegistroComRelacoes } from '@/lib/queries/registros'

interface Props { registros: RegistroComRelacoes[] }

const STATUS_META = {
  ativo:      { label: 'Ativo',      cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  arquivado:  { label: 'Arquivado',  cls: 'bg-slate-100 text-slate-600',     icon: Archive },
  descartado: { label: 'Descartado', cls: 'bg-red-100 text-red-700',         icon: Trash2 },
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function diasParaPrazo(prazo: string | null): number | null {
  if (!prazo) return null
  const hoje = new Date()
  const p = new Date(prazo)
  return Math.ceil((p.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function StatusBtn({ id, status }: Readonly<{ id: string; status: string }>) {
  const [, start] = useTransition()
  const meta = STATUS_META[status as keyof typeof STATUS_META] ?? STATUS_META.ativo
  const Icon = meta.icon
  const nextStatus = status === 'ativo' ? 'arquivado' : status === 'arquivado' ? 'descartado' : 'ativo'
  return (
    <button
      type="button"
      onClick={() => start(async () => { await updateRegistroStatus(id, nextStatus as 'ativo' | 'arquivado' | 'descartado') })}
      className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold hover:opacity-80 transition-opacity', meta.cls)}
      title={`Mudar para: ${STATUS_META[nextStatus as keyof typeof STATUS_META]?.label}`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </button>
  )
}

function PrazoCell({ prazo, status }: Readonly<{ prazo: string | null; status: string }>) {
  const dias = diasParaPrazo(prazo)
  if (!prazo) return <span className="text-slate-400">∞</span>
  if (status !== 'ativo') return <span className="text-slate-400">{fmtDate(prazo)}</span>
  if (dias === null) return <span className="text-slate-400">{fmtDate(prazo)}</span>
  if (dias < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-700 font-bold">
        <AlertTriangle className="h-3 w-3" /> Vencido há {Math.abs(dias)}d
      </span>
    )
  }
  if (dias <= 30) return <span className="text-amber-700 font-bold">{dias}d ({fmtDate(prazo)})</span>
  return <span className="text-slate-600">{fmtDate(prazo)}</span>
}

export function RegistroTable({ registros }: Readonly<Props>) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Registros</h2>
          <p className="text-xs text-slate-500 mt-0.5">{registros.length} registro(s)</p>
        </div>
        <Link
          href="/registros/novo"
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Registro
        </Link>
      </div>

      {registros.length === 0 ? (
        <div className="py-20 text-center">
          <FolderOpen className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Nenhum registro cadastrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Status', 'Código', 'Título', 'Tipo', 'Área', 'Criado', 'Descarte', ''].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 first:pl-6 last:pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 pl-6">
                    <StatusBtn id={r.id} status={r.status} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-700 font-mono">{r.codigo ?? '—'}</td>
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <p className="font-semibold text-slate-900 truncate">{r.titulo}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{r.tipo_def?.nome ?? r.tipo ?? '—'}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{r.areas?.nome ?? '—'}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{fmtDate(r.data_criacao ?? r.created_at)}</td>
                  <td className="px-4 py-3.5 text-xs">
                    <PrazoCell prazo={r.prazo_descarte} status={r.status} />
                  </td>
                  <td className="px-4 py-3.5 pr-6">
                    <Link href={`/registros/${r.id}`} className="text-xs font-bold text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
