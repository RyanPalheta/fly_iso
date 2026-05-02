import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Calendar, PlayCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { listReunioes, getReuniaoStats } from '@/lib/queries/reunioes'

export const metadata: Metadata = { title: 'Análise Crítica | Fly ISO' }

const STATUS_META = {
  planejada:    { label: 'Planejada',    cls: 'bg-violet-100 text-violet-700', icon: Calendar },
  em_andamento: { label: 'Em Andamento', cls: 'bg-amber-100 text-amber-700',   icon: PlayCircle },
  concluida:    { label: 'Concluída',    cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function AnaliseCriticaPage() {
  const [reunioes, stats] = await Promise.all([listReunioes(), getReuniaoStats()])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Análise Crítica</h1>
          <p className="text-sm text-slate-500 mt-1">Reuniões de análise crítica — ISO 9001:2015 cláusula 9.3</p>
        </div>
        <Link
          href="/analise-critica/nova"
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Reunião
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total,        ic: 'text-blue-700',    ib: 'bg-blue-100',    bg: 'bg-blue-50', icon: Calendar },
          { label: 'Planejadas', value: stats.planejadas, ic: 'text-violet-700',  ib: 'bg-violet-100',  bg: 'bg-violet-50', icon: Calendar },
          { label: 'Em Andamento', value: stats.em_andamento, ic: 'text-amber-700', ib: 'bg-amber-100', bg: 'bg-amber-50', icon: PlayCircle },
          { label: 'Concluídas', value: stats.concluidas, ic: 'text-emerald-700', ib: 'bg-emerald-100', bg: 'bg-emerald-50', icon: CheckCircle2 },
        ].map(({ label, value, ic, ib, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 ring-1 ring-black/5`}>
            <div className={`w-9 h-9 rounded-xl ${ib} flex items-center justify-center mb-3`}>
              <Icon className={`h-4 w-4 ${ic}`} />
            </div>
            <div className={`text-2xl font-extrabold ${ic}`}>{value}</div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Reuniões de Análise Crítica</h2>
        </div>

        {reunioes.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-500">Nenhuma reunião cadastrada</p>
            <p className="text-xs text-slate-400 mt-1">Crie a primeira reunião de análise crítica</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Status', 'Título', 'Data', 'Ações'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 first:pl-6 last:pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reunioes.map((r) => {
                const meta = STATUS_META[r.status as keyof typeof STATUS_META] ?? STATUS_META.planejada
                const Icon = meta.icon
                return (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 pl-6">
                      <span className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit', meta.cls)}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/analise-critica/${r.id}`} className="font-semibold text-slate-900 hover:text-blue-700 transition-colors">
                        {r.titulo}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {fmtDate(r.data)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 pr-6">
                      <Link href={`/analise-critica/${r.id}`} className="text-xs font-bold text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                        Abrir
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
