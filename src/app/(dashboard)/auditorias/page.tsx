import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, ClipboardCheck, Settings, AlertTriangle, CheckCircle2, Clock, PlayCircle } from 'lucide-react'
import { listAuditorias, getAuditoriaStats } from '@/lib/queries/auditorias'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Auditorias | Fly ISO' }

const STATUS_META = {
  planejada:   { label: 'Planejada',   cls: 'bg-slate-100 text-slate-600',   icon: Clock },
  em_execucao: { label: 'Em execução', cls: 'bg-amber-100 text-amber-700',   icon: PlayCircle },
  concluida:   { label: 'Concluída',   cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelada:   { label: 'Cancelada',   cls: 'bg-red-100 text-red-500',       icon: AlertTriangle },
}

const TIPO_LABEL: Record<string, string> = {
  interna:    'Interna',
  fornecedor: 'Fornecedor',
  '5s':       '5S',
  seguranca:  'Segurança',
  externa:    'Externa',
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function AuditoriasPage() {
  const [auditorias, stats] = await Promise.all([listAuditorias(), getAuditoriaStats()])

  const cards = [
    { label: 'Total',        value: stats.total,       icon: ClipboardCheck, cls: 'bg-blue-50 text-blue-700' },
    { label: 'Planejadas',   value: stats.planejadas,  icon: Clock,          cls: 'bg-slate-50 text-slate-700' },
    { label: 'Em execução',  value: stats.em_execucao, icon: PlayCircle,     cls: 'bg-amber-50 text-amber-700' },
    { label: 'Concluídas',   value: stats.concluidas,  icon: CheckCircle2,   cls: 'bg-emerald-50 text-emerald-700' },
    { label: 'NCs geradas',  value: stats.nc_geradas,  icon: AlertTriangle,  cls: 'bg-red-50 text-red-700' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Auditorias</h1>
          <p className="text-sm text-slate-500 mt-1">
            Programa de auditorias internas, 5S, fornecedores e segurança — ISO 9001 §9.2
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/auditorias/checklists"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-sm font-semibold ring-1 ring-slate-200">
            <Settings className="h-4 w-4" /> Checklists
          </Link>
          <Link href="/auditorias/nova"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold">
            <Plus className="h-4 w-4" /> Nova Auditoria
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {cards.map(({ label, value, icon: Icon, cls }) => (
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

      {auditorias.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-black/5 p-12 text-center">
          <ClipboardCheck className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhuma auditoria registrada.</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Programe sua primeira auditoria interna.</p>
          <Link href="/auditorias/nova"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold">
            <Plus className="h-4 w-4" /> Nova Auditoria
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 py-3">Código</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Título</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Tipo</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Auditor líder</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Planejada</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Pontuação</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {auditorias.map((a) => {
                const statusMeta = STATUS_META[a.status] ?? STATUS_META.planejada
                const Icon = statusMeta.icon
                const pct = a.pontuacao_max > 0 ? Math.round((a.pontuacao_total / a.pontuacao_max) * 100) : null
                return (
                  <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-xs text-slate-700 font-mono">{a.codigo}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate">{a.titulo}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{TIPO_LABEL[a.tipo] ?? a.tipo}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{a.auditor_lider?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(a.data_planejada)}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-slate-700 tabular-nums">
                      {pct !== null ? `${pct}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', statusMeta.cls)}>
                        <Icon className="h-2.5 w-2.5" /> {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/auditorias/${a.id}`} className="text-xs font-bold text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg">
                        Abrir
                      </Link>
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
