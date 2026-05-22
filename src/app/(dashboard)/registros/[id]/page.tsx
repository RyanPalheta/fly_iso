import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Archive, CheckCircle2, Trash2, FileText, Calendar, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRegistro } from '@/lib/queries/registros'
import type { RegistroCampoDef } from '@/types/database'

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

function renderCampoValor(campo: RegistroCampoDef, raw: unknown) {
  if (raw === undefined || raw === null || raw === '') {
    return <span className="text-slate-400">—</span>
  }

  switch (campo.type) {
    case 'boolean':
      return raw === true
        ? <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 className="h-3.5 w-3.5" /> Sim</span>
        : <span className="inline-flex items-center gap-1 text-red-700 font-bold"><Trash2 className="h-3.5 w-3.5" /> Não</span>

    case 'date':
      return <span className="font-mono">{fmtDate(raw as string)}</span>

    case 'textarea':
      return <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{raw as string}</p>

    case 'files': {
      const files = Array.isArray(raw) ? raw as Array<{ url: string; nome: string }> : []
      if (files.length === 0) return <span className="text-slate-400">—</span>
      return (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
              <FileText className="h-3.5 w-3.5" /> {f.nome}
            </a>
          ))}
        </div>
      )
    }

    case 'number':
      return <span className="font-mono tabular-nums">{String(raw)}</span>

    default:
      return <span className="text-sm">{String(raw)}</span>
  }
}

export default async function RegistroDetailPage({ params }: Props) {
  const { id } = await params
  const registro = await getRegistro(id)
  if (!registro) notFound()

  const { label, cls, icon: Icon } = STATUS_META[registro.status as keyof typeof STATUS_META] ?? STATUS_META.ativo
  const campos = registro.tipo_def?.campos ?? []
  const hoje = new Date().toISOString().split('T')[0]
  const vencido = registro.status === 'ativo' && !registro.arquivado_em &&
                  registro.prazo_descarte && registro.prazo_descarte < hoje

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 text-sm">
        <Link href="/registros" className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" /> Registros
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold truncate">{registro.titulo}</span>
      </div>

      {vencido && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-900">Prazo de descarte vencido em {fmtDate(registro.prazo_descarte)}.</p>
            <p className="text-xs text-amber-700 mt-0.5">Este registro deve ser arquivado ou descartado conforme política do tipo.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-3 mb-4">
          <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', cls)}>
            <Icon className="h-3 w-3" />
            {label}
          </span>
          {registro.codigo && (
            <span className="text-xs text-slate-500 font-mono">{registro.codigo}</span>
          )}
          {registro.tipo_def && (
            <span className="text-xs text-slate-400">{registro.tipo_def.nome}</span>
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{registro.titulo}</h1>

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: 'Área',         value: registro.areas?.nome ?? '—' },
            { label: 'Criado em',    value: fmtDate(registro.data_criacao ?? registro.created_at) },
            { label: 'Prazo de descarte', value: fmtDate(registro.prazo_descarte) || '—' },
            { label: 'Arquivado em', value: fmtDate(registro.data_arquivamento) },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</dt>
              <dd className="text-sm font-semibold text-slate-900 mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Dados dinâmicos */}
      {campos.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            Dados do registro
          </h2>
          <dl className="space-y-5">
            {campos.map((c) => (
              <div key={c.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  {c.label}
                </dt>
                <dd>{renderCampoValor(c, (registro.dados as Record<string, unknown>)?.[c.id])}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
