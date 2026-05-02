import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Archive, CheckCircle2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRegistro } from '@/lib/queries/registros'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const r = await getRegistro(id)
  return { title: r ? `${r.titulo} | Fly ISO` : 'Registro | Fly ISO' }
}

const STATUS_META = {
  ativo:      { label: 'Ativo',      cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  arquivado:  { label: 'Arquivado',  cls: 'bg-slate-100 text-slate-600',     icon: Archive },
  descartado: { label: 'Descartado', cls: 'bg-red-100 text-red-700',         icon: Trash2 },
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function RegistroDetailPage({ params }: Props) {
  const { id } = await params
  const registro = await getRegistro(id)
  if (!registro) notFound()

  const { label, cls, icon: Icon } = STATUS_META[registro.status as keyof typeof STATUS_META] ?? STATUS_META.ativo

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3 text-sm">
        <Link href="/registros" className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" /> Registros
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold truncate">{registro.titulo}</span>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-3 mb-4">
          <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', cls)}>
            <Icon className="h-3 w-3" />
            {label}
          </span>
          {registro.tipo && (
            <span className="text-xs text-slate-400">{registro.tipo}</span>
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{registro.titulo}</h1>

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: 'Área',        value: registro.areas?.nome ?? '—' },
            { label: 'Responsável', value: registro.responsavel?.nome ?? '—' },
            { label: 'Criado em',   value: fmtDate(registro.data_criacao ?? registro.created_at) },
            { label: 'Arquivado em', value: fmtDate(registro.data_arquivamento) },
            { label: 'Descartado em', value: fmtDate(registro.data_descarte) },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</dt>
              <dd className="text-sm font-semibold text-slate-900 mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
