import type { Metadata } from 'next'
import Link from 'next/link'
import { Archive, CheckCircle2, Trash2, FolderOpen, AlertTriangle, Plus, Settings } from 'lucide-react'
import { RegistroTable } from '@/components/registros/registro-table'
import { listRegistros, getRegistroStats } from '@/lib/queries/registros'
import { listRegistroTipos } from '@/lib/queries/registro-tipos'

export const metadata: Metadata = { title: 'Registros | Fly ISO' }

interface Props {
  searchParams: Promise<{ tipo?: string; vencidos?: string }>
}

export default async function RegistrosPage({ searchParams }: Props) {
  const sp = await searchParams
  const tipoId   = sp.tipo
  const soVencidos = sp.vencidos === '1'

  const [registros, stats, tipos] = await Promise.all([
    listRegistros({ tipoId, vencidos: soVencidos || undefined }),
    getRegistroStats(),
    listRegistroTipos({ somenteAtivos: true }),
  ])

  const cards = [
    { label: 'Total',       value: stats.total,       icon: FolderOpen,    bg: 'bg-blue-50',    ic: 'text-blue-700',    ib: 'bg-blue-100'    },
    { label: 'Ativos',      value: stats.ativos,      icon: CheckCircle2,  bg: 'bg-emerald-50', ic: 'text-emerald-700', ib: 'bg-emerald-100' },
    { label: 'Arquivados',  value: stats.arquivados,  icon: Archive,       bg: 'bg-slate-50',   ic: 'text-slate-600',   ib: 'bg-slate-100'   },
    { label: 'Descartados', value: stats.descartados, icon: Trash2,        bg: 'bg-red-50',     ic: 'text-red-700',     ib: 'bg-red-100'     },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Registros da Qualidade</h1>
          <p className="text-sm text-slate-500 mt-1">Gestão de registros e evidências do SGQ — ISO 9001 §7.5</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/configuracoes/registros-tipos"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-sm font-semibold ring-1 ring-slate-200"
          >
            <Settings className="h-4 w-4" /> Tipos
          </Link>
          <Link
            href="/registros/novo"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold"
          >
            <Plus className="h-4 w-4" /> Novo Registro
          </Link>
        </div>
      </div>

      {/* Vencidos alert */}
      {stats.vencidos > 0 && !soVencidos && (
        <Link
          href="/registros?vencidos=1"
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">
              {stats.vencidos} registro(s) com prazo de descarte vencido.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Clique para revisar e processar conforme a política do tipo.</p>
          </div>
        </Link>
      )}

      {soVencidos && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Filtro: registros com prazo vencido
          </p>
          <Link href="/registros" className="text-xs font-bold text-amber-700 hover:underline">Limpar filtro</Link>
        </div>
      )}

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

      {/* Tipo filter chips */}
      {tipos.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo:</span>
          <Link href="/registros"
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              !tipoId ? 'bg-blue-600 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            Todos
          </Link>
          {tipos.map((t) => (
            <Link key={t.id} href={`/registros?tipo=${t.id}`}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                tipoId === t.id ? 'bg-blue-600 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {t.nome}
            </Link>
          ))}
        </div>
      )}

      <RegistroTable registros={registros} />
    </div>
  )
}
