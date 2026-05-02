import type { Metadata } from 'next'
import { Archive, CheckCircle2, Trash2, FolderOpen } from 'lucide-react'
import { RegistroTable } from '@/components/registros/registro-table'
import { listRegistros, getRegistroStats } from '@/lib/queries/registros'

export const metadata: Metadata = { title: 'Registros | Fly ISO' }

export default async function RegistrosPage() {
  const [registros, stats] = await Promise.all([listRegistros(), getRegistroStats()])

  const cards = [
    { label: 'Total', value: stats.total,       icon: FolderOpen,   bg: 'bg-blue-50',    ic: 'text-blue-700',    ib: 'bg-blue-100' },
    { label: 'Ativos', value: stats.ativos,     icon: CheckCircle2, bg: 'bg-emerald-50', ic: 'text-emerald-700', ib: 'bg-emerald-100' },
    { label: 'Arquivados', value: stats.arquivados, icon: Archive,  bg: 'bg-slate-50',   ic: 'text-slate-600',   ib: 'bg-slate-100' },
    { label: 'Descartados', value: stats.descartados, icon: Trash2, bg: 'bg-red-50',     ic: 'text-red-700',     ib: 'bg-red-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Registros da Qualidade</h1>
        <p className="text-sm text-slate-500 mt-1">Gestão de registros e evidências do SGQ</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, bg, ic, ib }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 ring-1 ring-black/5`}>
            <div className={`w-9 h-9 rounded-xl ${ib} flex items-center justify-center mb-3`}>
              <Icon className={`h-4 w-4 ${ic}`} />
            </div>
            <div className={`text-2xl font-extrabold ${ic}`}>{value}</div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <RegistroTable registros={registros} />
    </div>
  )
}
