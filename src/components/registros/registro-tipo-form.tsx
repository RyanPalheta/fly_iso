'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, GripVertical, AlertCircle, Loader2, Check, ChevronUp, ChevronDown,
  Type, AlignLeft, Hash, Calendar, ToggleLeft, List, Paperclip, User as UserIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createRegistroTipo, updateRegistroTipo } from '@/lib/actions/registros'
import type { RegistroCampoDef, RegistroCampoTipo, RegistroDescarteAcao } from '@/types/database'

interface Props {
  modo: 'create' | 'edit'
  initial?: {
    id:             string
    codigo:         string
    nome:           string
    descricao:      string | null
    campos:         RegistroCampoDef[]
    retencao_meses: number
    descarte_acao:  RegistroDescarteAcao
    ativo:          boolean
  }
}

const CAMPO_TIPOS: Array<{ value: RegistroCampoTipo; label: string; icon: React.ElementType }> = [
  { value: 'text',     label: 'Texto curto',  icon: Type },
  { value: 'textarea', label: 'Texto longo',  icon: AlignLeft },
  { value: 'number',   label: 'Número',       icon: Hash },
  { value: 'date',     label: 'Data',         icon: Calendar },
  { value: 'boolean',  label: 'Sim/Não',      icon: ToggleLeft },
  { value: 'select',   label: 'Lista',        icon: List },
  { value: 'files',    label: 'Anexos',       icon: Paperclip },
  { value: 'user',     label: 'Usuário',      icon: UserIcon },
]

const DESCARTE_OPTIONS: Array<{ value: RegistroDescarteAcao; label: string; desc: string }> = [
  { value: 'arquivar',              label: 'Arquivar',           desc: 'Após o prazo, marca como arquivado mas mantém o registro.' },
  { value: 'descartar',             label: 'Descartar',          desc: 'Após o prazo, marca como descartado (registro permanece para auditoria).' },
  { value: 'reter_indefinidamente', label: 'Reter indefinidamente', desc: 'Não aplica prazo de descarte.' },
]

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}

export function RegistroTipoForm({ modo, initial }: Readonly<Props>) {
  const router = useRouter()
  const [, startTrans] = useTransition()

  const [codigo, setCodigo]           = useState(initial?.codigo ?? '')
  const [nome, setNome]               = useState(initial?.nome ?? '')
  const [descricao, setDescricao]     = useState(initial?.descricao ?? '')
  const [retencao, setRetencao]       = useState<number | ''>(initial?.retencao_meses ?? 60)
  const [descarteAcao, setDescarteAcao] = useState<RegistroDescarteAcao>(initial?.descarte_acao ?? 'arquivar')
  const [ativo, setAtivo]             = useState(initial?.ativo ?? true)
  const [campos, setCampos]           = useState<RegistroCampoDef[]>(initial?.campos ?? [])

  const [error, setError]   = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'
  const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5'

  const addCampo = () => {
    const novoLabel = `Campo ${campos.length + 1}`
    setCampos((cs) => [...cs, {
      id:       slugify(novoLabel) + '_' + Math.random().toString(36).slice(2, 6),
      label:    novoLabel,
      type:     'text',
      required: false,
    }])
  }

  const updateCampo = (idx: number, patch: Partial<RegistroCampoDef>) => {
    setCampos((cs) => cs.map((c, i) => i === idx ? { ...c, ...patch } : c))
  }

  const removeCampo = (idx: number) => {
    setCampos((cs) => cs.filter((_, i) => i !== idx))
  }

  const moveCampo = (idx: number, dir: -1 | 1) => {
    const ni = idx + dir
    if (ni < 0 || ni >= campos.length) return
    setCampos((cs) => {
      const next = [...cs]
      ;[next[idx], next[ni]] = [next[ni], next[idx]]
      return next
    })
  }

  const handleSubmit = async () => {
    setError(null)
    if (!codigo.trim()) { setError('Código obrigatório.'); return }
    if (!nome.trim())   { setError('Nome obrigatório.'); return }
    if (campos.length === 0) { setError('Adicione pelo menos um campo.'); return }

    const payload = {
      codigo,
      nome,
      descricao,
      campos,
      retencaoMeses: typeof retencao === 'number' ? retencao : 0,
      descarteAcao,
    }

    setPending(true)
    const result = modo === 'create'
      ? await createRegistroTipo(payload)
      : await updateRegistroTipo({ ...payload, id: initial!.id, ativo })
    setPending(false)

    if (!result.ok) { setError(result.error ?? 'Erro ao salvar.'); return }
    startTrans(() => {
      router.push('/configuracoes/registros-tipos')
      router.refresh()
    })
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
            <span className="text-blue-700">01.</span> Identificação do Tipo
          </label>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Código *</label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                placeholder="INSP_RECEB"
                className={`${inputCls} font-mono`}
                maxLength={50}
              />
              <p className="text-[10px] text-slate-400 mt-1">Maiúsculas e _</p>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Inspeção de Recebimento"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Descrição</label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Para que serve esse tipo de registro?"
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Campos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-blue-700">02.</span> Campos do Formulário ({campos.length})
            </label>
            <button type="button" onClick={addCampo}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
              <Plus className="h-3.5 w-3.5" /> Adicionar Campo
            </button>
          </div>

          {campos.length === 0 && (
            <div className="bg-slate-50 rounded-xl p-8 text-center ring-1 ring-slate-200">
              <p className="text-sm text-slate-400">Nenhum campo configurado.</p>
              <p className="text-xs text-slate-400 mt-1">Adicione campos para definir o que será coletado em cada registro.</p>
            </div>
          )}

          <div className="space-y-3">
            {campos.map((c, idx) => {
              const tipoMeta = CAMPO_TIPOS.find((t) => t.value === c.type)!
              const TipoIcon = tipoMeta.icon
              return (
                <div key={c.id + idx} className="bg-slate-50 rounded-xl p-4 ring-1 ring-slate-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => moveCampo(idx, -1)} disabled={idx === 0}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <GripVertical className="h-3 w-3 text-slate-300" />
                      <button type="button" onClick={() => moveCampo(idx, +1)} disabled={idx === campos.length - 1}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-12 gap-3">
                      <div className="col-span-5">
                        <label className={labelCls}>Rótulo (label) *</label>
                        <input type="text" value={c.label}
                          onChange={(e) => updateCampo(idx, { label: e.target.value })}
                          className={inputCls} />
                      </div>
                      <div className="col-span-4">
                        <label className={labelCls}>ID interno</label>
                        <input type="text" value={c.id}
                          onChange={(e) => updateCampo(idx, { id: slugify(e.target.value) })}
                          className={`${inputCls} font-mono text-xs`} />
                      </div>
                      <div className="col-span-3">
                        <label className={labelCls}>Tipo</label>
                        <select value={c.type}
                          onChange={(e) => updateCampo(idx, { type: e.target.value as RegistroCampoTipo })}
                          className={`${inputCls} cursor-pointer`}>
                          {CAMPO_TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <button type="button" onClick={() => removeCampo(idx)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pl-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={c.required}
                        onChange={(e) => updateCampo(idx, { required: e.target.checked })}
                        className="rounded" />
                      <span className="text-xs font-semibold text-slate-700">Obrigatório</span>
                    </label>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 ml-auto">
                      <TipoIcon className="h-3 w-3" /> {tipoMeta.label}
                    </div>
                  </div>

                  {c.type === 'select' && (
                    <div className="pl-8">
                      <label className={labelCls}>Opções (uma por linha)</label>
                      <textarea rows={3}
                        value={(c.options ?? []).join('\n')}
                        onChange={(e) => updateCampo(idx, {
                          options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                        })}
                        placeholder="Aprovado&#10;Aprovado com restrição&#10;Reprovado"
                        className={`${inputCls} resize-none text-xs font-mono`} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
            {modo === 'create' ? 'Criar Tipo' : 'Salvar Alterações'}
          </button>
        </div>
      </section>

      <aside className="w-72 shrink-0 space-y-5 sticky top-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retenção</h3>

          <div>
            <label className={labelCls}>Prazo (meses)</label>
            <input type="number" min={0} value={retencao}
              onChange={(e) => setRetencao(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputCls} disabled={descarteAcao === 'reter_indefinidamente'} />
            <p className="text-[10px] text-slate-400 mt-1">5 anos = 60 · 10 anos = 120</p>
          </div>

          <div>
            <label className={labelCls}>Ação ao vencer</label>
            <div className="space-y-2">
              {DESCARTE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setDescarteAcao(opt.value)}
                  className={cn(
                    'w-full text-left p-2.5 rounded-lg ring-1 transition-all',
                    descarteAcao === opt.value
                      ? 'bg-blue-50 ring-blue-300'
                      : 'bg-slate-50 ring-slate-200 hover:bg-slate-100'
                  )}
                >
                  <p className={cn('text-xs font-bold', descarteAcao === opt.value ? 'text-blue-800' : 'text-slate-700')}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {modo === 'edit' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
              <span className="text-sm font-semibold text-slate-700">
                {ativo ? 'Tipo ativo (disponível para novos registros)' : 'Tipo inativo'}
              </span>
            </label>
          </div>
        )}
      </aside>
    </div>
  )
}
