'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, Loader2, Check, Calendar, Hash, ToggleLeft, ToggleRight,
  X, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createRegistro } from '@/lib/actions/registros'
import { FileUpload } from '@/components/shared/file-upload'
import type { RegistroTipoRow } from '@/lib/queries/registro-tipos'
import type { AreaComUnidade } from '@/lib/queries/areas'

interface Props {
  tipo:  RegistroTipoRow
  areas: AreaComUnidade[]
}

interface FileAttachment {
  url:  string
  nome: string
}

export function RegistroDynamicForm({ tipo, areas }: Readonly<Props>) {
  const router = useRouter()

  const [titulo, setTitulo]       = useState('')
  const [areaId, setAreaId]       = useState('')
  const [dataCriacao, setData]    = useState(new Date().toISOString().split('T')[0])
  const [dados, setDados]         = useState<Record<string, unknown>>({})

  const [error, setError]   = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'
  const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5'

  const setField = (id: string, value: unknown) => {
    setDados((d) => ({ ...d, [id]: value }))
  }

  const handleSubmit = async () => {
    setError(null)
    if (!titulo.trim()) { setError('Título obrigatório.'); return }

    setPending(true)
    const result = await createRegistro({
      tipoId: tipo.id,
      titulo,
      dados,
      areaId: areaId || undefined,
      dataCriacao,
    })
    setPending(false)

    if (!result.ok) { setError(result.error ?? 'Erro ao salvar.'); return }
    router.push(`/registros/${result.id}`)
  }

  return (
    <div className="flex gap-8 items-start">
      <section className="flex-1 min-w-0 space-y-5">
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Identificação */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="text-blue-700">01.</span> Identificação
          </label>
          <div>
            <label className={labelCls}>Título *</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Inspeção do lote 2026-04-15"
              className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Data do Registro</label>
              <input type="date" value={dataCriacao} onChange={(e) => setData(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Área</label>
              <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="">— Selecionar —</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}{a.unidade ? ` · ${a.unidade.nome}` : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Campos dinâmicos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="text-blue-700">02.</span> {tipo.nome}
          </label>

          {tipo.campos.map((c) => (
            <DynamicField
              key={c.id}
              campo={c}
              value={dados[c.id]}
              onChange={(v) => setField(c.id, v)}
              tipoCodigo={tipo.codigo}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} disabled={pending}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={pending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md disabled:opacity-50 flex items-center gap-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Criar Registro
          </button>
        </div>
      </section>

      {/* Sidebar com info do tipo */}
      <aside className="w-72 shrink-0 space-y-4 sticky top-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tipo de Registro</h3>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest">{tipo.codigo}</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{tipo.nome}</p>
          {tipo.descricao && (
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{tipo.descricao}</p>
          )}
        </div>

        <div className="bg-blue-50 rounded-2xl p-5 ring-1 ring-blue-200/40">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-700" />
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Retenção</h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {tipo.descarte_acao === 'reter_indefinidamente'
              ? 'Este tipo é retido indefinidamente — não há prazo de descarte.'
              : `${tipo.retencao_meses} meses após a criação, o registro será ${
                  tipo.descarte_acao === 'descartar' ? 'descartado' : 'arquivado'
                } automaticamente.`}
          </p>
        </div>
      </aside>
    </div>
  )
}

// ── Renderiza um campo dinâmico baseado no tipo ───────────────────────────────
function DynamicField({
  campo, value, onChange, tipoCodigo,
}: Readonly<{
  campo: RegistroTipoRow['campos'][number]
  value: unknown
  onChange: (v: unknown) => void
  tipoCodigo: string
}>) {
  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'
  const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5'

  const fullLabel = (
    <label className={labelCls}>
      {campo.label}
      {campo.required && <span className="text-red-500 normal-case ml-1">*</span>}
    </label>
  )

  switch (campo.type) {
    case 'text':
      return (
        <div>{fullLabel}
          <input type="text" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls} />
        </div>
      )

    case 'textarea':
      return (
        <div>{fullLabel}
          <textarea rows={3} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={`${inputCls} resize-none`} />
        </div>
      )

    case 'number':
      return (
        <div>{fullLabel}
          <div className="relative">
            <Hash className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="number" value={(value as number) ?? ''}
              onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
              className={`${inputCls} pl-9`} />
          </div>
        </div>
      )

    case 'date':
      return (
        <div>{fullLabel}
          <input type="date" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls} />
        </div>
      )

    case 'boolean': {
      const v = value === true
      return (
        <div>{fullLabel}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onChange(true)}
              className={cn('flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all',
                v ? 'bg-emerald-50 ring-2 ring-emerald-300 text-emerald-800' : 'bg-slate-50 ring-1 ring-slate-200 text-slate-500 hover:bg-slate-100'
              )}>
              <ToggleRight className="h-4 w-4" /> Sim
            </button>
            <button type="button" onClick={() => onChange(false)}
              className={cn('flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all',
                value === false ? 'bg-red-50 ring-2 ring-red-300 text-red-800' : 'bg-slate-50 ring-1 ring-slate-200 text-slate-500 hover:bg-slate-100'
              )}>
              <ToggleLeft className="h-4 w-4" /> Não
            </button>
          </div>
        </div>
      )
    }

    case 'select':
      return (
        <div>{fullLabel}
          <select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={`${inputCls} cursor-pointer`}>
            <option value="">— Selecionar —</option>
            {(campo.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )

    case 'files': {
      const files = (value as FileAttachment[]) ?? []
      return (
        <div>{fullLabel}
          <div className="space-y-2">
            {files.length > 0 && (
              <div className="space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-xs">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 truncate text-blue-700 hover:underline font-medium">{f.nome}</a>
                    <button type="button" onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <FileUpload
              bucket="registros"
              path={`${tipoCodigo}/${campo.id}/${Date.now()}`}
              maxSizeMB={20}
              onUpload={(url, nome) => onChange([...files, { url, nome }])}
              label="Anexar arquivo"
            />
          </div>
        </div>
      )
    }

    case 'user':
      return (
        <div>{fullLabel}
          <input type="text" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}
            placeholder="Nome do usuário" className={inputCls} />
        </div>
      )

    default:
      return null
  }
}
