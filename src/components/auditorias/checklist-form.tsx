'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, AlertCircle, Loader2, Check, ChevronUp, ChevronDown,
  GripVertical, FileCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveChecklist } from '@/lib/actions/auditorias'
import type { AuditoriaPergunta, AuditoriaOpcaoResposta } from '@/types/database'

interface Props {
  modo: 'create' | 'edit'
  initial?: {
    id: string
    codigo: string
    nome: string
    descricao: string | null
    tipo: string | null
    perguntas: AuditoriaPergunta[]
    ativo: boolean
  }
}

const TIPOS = [
  { value: 'interna',    label: 'Interna (ISO)' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: '5s',         label: '5S' },
  { value: 'seguranca',  label: 'Segurança' },
  { value: 'livre',      label: 'Livre' },
]

const OPCOES_PADRAO_ISO: AuditoriaOpcaoResposta[] = [
  { valor: 'conforme',   label: 'Conforme',   pontos: 5 },
  { valor: 'nc_menor',   label: 'NC Menor',   pontos: 2 },
  { valor: 'nc_maior',   label: 'NC Maior',   pontos: 0 },
  { valor: 'observacao', label: 'Observação', pontos: 4 },
  { valor: 'na',         label: 'N/A',        pontos: null },
]

const OPCOES_PADRAO_5S: AuditoriaOpcaoResposta[] = [
  { valor: 'otimo',   label: 'Ótimo',   pontos: 4 },
  { valor: 'bom',     label: 'Bom',     pontos: 3 },
  { valor: 'regular', label: 'Regular', pontos: 2 },
  { valor: 'ruim',    label: 'Ruim',    pontos: 1 },
  { valor: 'critico', label: 'Crítico', pontos: 0 },
]

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)
}

export function ChecklistForm({ modo, initial }: Readonly<Props>) {
  const router = useRouter()
  const [codigo, setCodigo]       = useState(initial?.codigo ?? '')
  const [nome, setNome]           = useState(initial?.nome ?? '')
  const [descricao, setDescricao] = useState(initial?.descricao ?? '')
  const [tipo, setTipo]           = useState(initial?.tipo ?? 'interna')
  const [ativo, setAtivo]         = useState(initial?.ativo ?? true)
  const [perguntas, setPerguntas] = useState<AuditoriaPergunta[]>(initial?.perguntas ?? [])

  const [error, setError]   = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'
  const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5'

  const addPergunta = () => {
    const defaults = tipo === '5s' ? OPCOES_PADRAO_5S : OPCOES_PADRAO_ISO
    setPerguntas((ps) => [...ps, {
      id:          'q' + (ps.length + 1) + '_' + Math.random().toString(36).slice(2, 6),
      texto:       '',
      clausula:    '',
      peso:        1,
      obrigatoria: true,
      opcoes:      [...defaults],
    }])
  }

  const updatePergunta = (idx: number, patch: Partial<AuditoriaPergunta>) => {
    setPerguntas((ps) => ps.map((p, i) => i === idx ? { ...p, ...patch } : p))
  }

  const removePergunta = (idx: number) => {
    setPerguntas((ps) => ps.filter((_, i) => i !== idx))
  }

  const movePergunta = (idx: number, dir: -1 | 1) => {
    const ni = idx + dir
    if (ni < 0 || ni >= perguntas.length) return
    setPerguntas((ps) => {
      const next = [...ps]
      ;[next[idx], next[ni]] = [next[ni], next[idx]]
      return next
    })
  }

  const handleSubmit = async () => {
    setError(null)
    if (!codigo.trim()) { setError('Código obrigatório.'); return }
    if (!nome.trim())   { setError('Nome obrigatório.'); return }
    if (perguntas.length === 0) { setError('Adicione pelo menos uma pergunta.'); return }

    setPending(true)
    const result = await saveChecklist({
      id: initial?.id,
      codigo, nome, descricao, tipo,
      perguntas,
      ativo,
    })
    setPending(false)
    if (!result.ok) { setError(result.error ?? 'Erro.'); return }
    router.push('/auditorias/checklists')
    router.refresh()
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

        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="text-blue-700">01.</span> Identificação
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Código *</label>
              <input type="text" value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                placeholder="ISO9001_CL7" className={`${inputCls} font-mono`} maxLength={50} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Nome *</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="ISO 9001:2015 — Cláusula 7" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Descrição</label>
            <textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder="Para que serve este checklist?" className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <div className="grid grid-cols-5 gap-2">
              {TIPOS.map((t) => (
                <button key={t.value} type="button" onClick={() => setTipo(t.value)}
                  className={cn(
                    'py-2 rounded-lg text-xs font-semibold transition-all',
                    tipo === t.value
                      ? 'bg-blue-50 ring-2 ring-blue-300 text-blue-800'
                      : 'bg-slate-50 ring-1 ring-slate-200 text-slate-600 hover:bg-slate-100'
                  )}>{t.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Perguntas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-blue-700">02.</span> Perguntas ({perguntas.length})
            </label>
            <button type="button" onClick={addPergunta}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
              <Plus className="h-3.5 w-3.5" /> Adicionar Pergunta
            </button>
          </div>

          {perguntas.length === 0 && (
            <div className="bg-slate-50 rounded-xl p-8 text-center ring-1 ring-slate-200">
              <FileCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhuma pergunta configurada.</p>
            </div>
          )}

          {perguntas.map((p, idx) => (
            <div key={idx} className="bg-slate-50 rounded-xl p-4 ring-1 ring-slate-200 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-0.5 mt-1">
                  <button type="button" onClick={() => movePergunta(idx, -1)} disabled={idx === 0}
                    className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <GripVertical className="h-3 w-3 text-slate-300" />
                  <button type="button" onClick={() => movePergunta(idx, +1)} disabled={idx === perguntas.length - 1}
                    className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-12 gap-3">
                  <div className="col-span-8">
                    <label className={labelCls}>Pergunta *</label>
                    <input type="text" value={p.texto}
                      onChange={(e) => updatePergunta(idx, { texto: e.target.value })}
                      placeholder="Os procedimentos estão atualizados?"
                      className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Cláusula</label>
                    <input type="text" value={p.clausula ?? ''}
                      onChange={(e) => updatePergunta(idx, { clausula: e.target.value })}
                      placeholder="7.5.2"
                      className={`${inputCls} font-mono text-xs`} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Peso</label>
                    <input type="number" min={1} max={20} value={p.peso}
                      onChange={(e) => updatePergunta(idx, { peso: Number(e.target.value) })}
                      className={`${inputCls} tabular-nums`} />
                  </div>
                </div>

                <button type="button" onClick={() => removePergunta(idx)}
                  className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Opções de resposta */}
              <div className="pl-8">
                <label className={labelCls}>Opções de resposta</label>
                <div className="space-y-1.5">
                  {p.opcoes.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="text" value={o.label}
                        onChange={(e) => {
                          const nOpc = [...p.opcoes]
                          nOpc[oi] = { ...o, label: e.target.value, valor: slugify(e.target.value) }
                          updatePergunta(idx, { opcoes: nOpc })
                        }}
                        placeholder="Label"
                        className={`${inputCls} text-xs flex-1`} />
                      <input type="number"
                        value={o.pontos ?? ''}
                        onChange={(e) => {
                          const nOpc = [...p.opcoes]
                          nOpc[oi] = { ...o, pontos: e.target.value === '' ? null : Number(e.target.value) }
                          updatePergunta(idx, { opcoes: nOpc })
                        }}
                        placeholder="N/A"
                        className={`${inputCls} text-xs w-20 tabular-nums text-center`} />
                      <button type="button"
                        onClick={() => {
                          const nOpc = p.opcoes.filter((_, i) => i !== oi)
                          updatePergunta(idx, { opcoes: nOpc })
                        }}
                        className="text-slate-400 hover:text-red-600 p-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => {
                      const nOpc = [...p.opcoes, { valor: 'nova', label: 'Nova', pontos: 0 }]
                      updatePergunta(idx, { opcoes: nOpc })
                    }}
                    className="text-xs text-blue-700 hover:underline font-bold">
                    + Adicionar opção
                  </button>
                </div>
              </div>

              <div className="pl-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={p.obrigatoria}
                    onChange={(e) => updatePergunta(idx, { obrigatoria: e.target.checked })} />
                  <span className="text-xs font-semibold text-slate-700">Obrigatória</span>
                </label>
              </div>
            </div>
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
            {modo === 'create' ? 'Criar Checklist' : 'Salvar Alterações'}
          </button>
        </div>
      </section>

      {modo === 'edit' && (
        <aside className="w-72 shrink-0">
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
              <span className="text-sm font-semibold text-slate-700">
                {ativo ? 'Ativo (disponível para auditorias)' : 'Inativo'}
              </span>
            </label>
          </div>
        </aside>
      )}
    </div>
  )
}
