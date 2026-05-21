'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, X, ChevronDown, AlertCircle, Loader2, Check,
  Flame, Minus, TrendingUp, Users2, Clock3, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createLnt, updateLntStatus } from '@/lib/actions/treinamentos'
import type { LntRow } from '@/lib/queries/treinamento-lnt'
import type { AreaComUnidade } from '@/lib/queries/areas'
import type { LntPrioridade, LntStatus } from '@/types/database'

interface Props {
  itens:      LntRow[]
  areas:      AreaComUnidade[]
  anoAtual:   number
  areaFiltro: string
}

const PRIORIDADE_META: Record<LntPrioridade, { label: string; cls: string; icon: React.ElementType }> = {
  alta:  { label: 'Alta',  cls: 'bg-red-100 text-red-700',      icon: Flame },
  media: { label: 'Média', cls: 'bg-amber-100 text-amber-700',  icon: TrendingUp },
  baixa: { label: 'Baixa', cls: 'bg-slate-100 text-slate-600',  icon: Minus },
}

const STATUS_META: Record<LntStatus, { label: string; cls: string }> = {
  identificada: { label: 'Identificada',  cls: 'bg-slate-100 text-slate-600' },
  aprovada:     { label: 'Aprovada',      cls: 'bg-blue-100 text-blue-700' },
  planejada:    { label: 'Planejada',     cls: 'bg-violet-100 text-violet-700' },
  em_execucao:  { label: 'Em execução',   cls: 'bg-amber-100 text-amber-700' },
  concluida:    { label: 'Concluída',     cls: 'bg-emerald-100 text-emerald-700' },
  cancelada:    { label: 'Cancelada',     cls: 'bg-red-100 text-red-500' },
}

const STATUS_FLOW: LntStatus[] = ['identificada', 'aprovada', 'planejada', 'em_execucao', 'concluida', 'cancelada']

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'
const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5'

export function LntPageClient({ itens, areas, anoAtual, areaFiltro }: Readonly<Props>) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [, startTrans] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formAreaId, setFormAreaId]               = useState('')
  const [formAno, setFormAno]                     = useState(anoAtual)
  const [formNome, setFormNome]                   = useState('')
  const [formDesc, setFormDesc]                   = useState('')
  const [formJust, setFormJust]                   = useState('')
  const [formPrioridade, setFormPrioridade]       = useState<LntPrioridade>('media')
  const [formQtd, setFormQtd]                     = useState<number | ''>(1)
  const [formCarga, setFormCarga]                 = useState<number | ''>(8)
  const [isPending, setIsPending]                 = useState(false)

  // Filters
  const [filterAno, setFilterAno]   = useState(anoAtual)
  const [filterArea, setFilterArea] = useState(areaFiltro)

  const handleFilter = () => {
    const params = new URLSearchParams()
    params.set('ano', String(filterAno))
    if (filterArea) params.set('area', filterArea)
    router.push(`/treinamentos/lnt?${params.toString()}`)
  }

  const resetForm = () => {
    setFormAreaId(''); setFormNome(''); setFormDesc(''); setFormJust('')
    setFormPrioridade('media'); setFormQtd(1); setFormCarga(8)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!formNome.trim()) { setError('Nome do treinamento obrigatório.'); return }
    if (typeof formQtd !== 'number' || formQtd < 1) { setError('Quantidade deve ser >= 1.'); return }
    setIsPending(true)
    const result = await createLnt({
      areaId:               formAreaId || undefined,
      ano:                  formAno,
      treinamentoNome:      formNome,
      descricao:            formDesc,
      justificativa:        formJust,
      prioridade:           formPrioridade,
      qtdPessoas:           formQtd,
      cargaHorariaEstimada: typeof formCarga === 'number' ? formCarga : undefined,
    })
    setIsPending(false)
    if (!result.ok) { setError(result.error ?? 'Erro.'); return }
    resetForm()
    setShowForm(false)
    router.refresh()
  }

  const handleStatusChange = (id: string, status: LntStatus) => {
    startTrans(async () => {
      await updateLntStatus(id, status)
      router.refresh()
    })
  }

  // Totais
  const totalPessoas = itens.reduce((s, i) => s + i.qtd_pessoas, 0)
  const totalHoras   = itens.reduce((s, i) => s + (i.carga_horaria_estimada ?? 0) * i.qtd_pessoas, 0)
  const totalItens   = itens.length
  const porStatus    = STATUS_FLOW.reduce((acc, s) => {
    acc[s] = itens.filter((i) => i.status === s).length; return acc
  }, {} as Record<LntStatus, number>)

  return (
    <div className="space-y-5">
      {/* Filters + New button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white rounded-xl ring-1 ring-slate-200 px-3 py-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ano</label>
          <input
            type="number"
            value={filterAno}
            onChange={(e) => setFilterAno(Number(e.target.value))}
            className="w-20 text-sm font-bold text-slate-800 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl ring-1 ring-slate-200 px-3 py-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Área</label>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="text-sm text-slate-700 outline-none bg-transparent cursor-pointer"
          >
            <option value="">Todas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}{a.unidade ? ` · ${a.unidade.nome}` : ''}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleFilter}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold"
        >
          Filtrar
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => { setShowForm(true); setError(null) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          <Plus className="h-4 w-4" /> Nova Necessidade
        </button>
      </div>

      {/* KPI summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Necessidades',       value: totalItens,   icon: Building2, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Pessoas impactadas', value: totalPessoas, icon: Users2,    cls: 'bg-violet-50 text-violet-700' },
          { label: 'H/H estimadas',      value: totalHoras,   icon: Clock3,    cls: 'bg-amber-50 text-amber-700' },
          { label: 'Aprovadas',          value: porStatus.aprovada + porStatus.planejada + porStatus.em_execucao + porStatus.concluida, icon: Check, cls: 'bg-emerald-50 text-emerald-700' },
        ].map(({ label, value, icon: Icon, cls }) => (
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

      {/* Inline form */}
      {showForm && (
        <div className="bg-white rounded-2xl ring-1 ring-blue-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-900">Nova Necessidade de Treinamento</h2>
            <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Nome do Treinamento *</label>
              <input type="text" value={formNome} onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Operação de Máquina CNC" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ano *</label>
              <input type="number" value={formAno} min={2020} max={2100}
                onChange={(e) => setFormAno(Number(e.target.value))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Área</label>
              <select value={formAreaId} onChange={(e) => setFormAreaId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="">Selecionar...</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}{a.unidade ? ` · ${a.unidade.nome}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Prioridade</label>
              <div className="flex gap-2">
                {(['alta', 'media', 'baixa'] as LntPrioridade[]).map((p) => {
                  const meta = PRIORIDADE_META[p]
                  return (
                    <button key={p} type="button"
                      onClick={() => setFormPrioridade(p)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-bold transition-all',
                        formPrioridade === p
                          ? `${meta.cls} ring-2 ring-offset-1 ring-current`
                          : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Qtd. Pessoas *</label>
              <input type="number" min={1} value={formQtd}
                onChange={(e) => setFormQtd(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Carga Horária Estimada (h)</label>
              <input type="number" min={0} value={formCarga}
                onChange={(e) => setFormCarga(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="8" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Justificativa</label>
            <textarea rows={2} value={formJust} onChange={(e) => setFormJust(e.target.value)}
              placeholder="Por que esse treinamento é necessário? (requisito legal, melhoria de processo, etc.)"
              className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Descrição / Conteúdo</label>
            <textarea rows={2} value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Objetivos, ementa, pré-requisitos..."
              className={`${inputCls} resize-none`} />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => { setShowForm(false); resetForm() }}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
              Cancelar
            </button>
            <button type="button" onClick={handleSubmit} disabled={isPending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar Necessidade
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {itens.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-black/5 p-12 text-center">
          <Building2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhuma necessidade identificada para {anoAtual}.</p>
          <p className="text-xs text-slate-400 mt-1">Clique em &quot;Nova Necessidade&quot; para adicionar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Treinamento</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Área</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Prioridade</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Pessoas</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">H/H</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => {
                const priorMeta = PRIORIDADE_META[item.prioridade]
                const PriorIcon = priorMeta.icon
                const statusMeta = STATUS_META[item.status]
                const hh = (item.carga_horaria_estimada ?? 0) * item.qtd_pessoas
                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{item.treinamento_nome}</p>
                      {item.justificativa && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{item.justificativa}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{item.area?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', priorMeta.cls)}>
                        <PriorIcon className="h-2.5 w-2.5" />
                        {priorMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-slate-700 tabular-nums">{item.qtd_pessoas}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-slate-700 tabular-nums">{hh || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as LntStatus)}
                          className={cn(
                            'appearance-none pl-2 pr-6 py-1 rounded-full text-[10px] font-bold cursor-pointer border-0 outline-none',
                            statusMeta.cls
                          )}
                        >
                          {STATUS_FLOW.map((s) => (
                            <option key={s} value={s}>{STATUS_META[s].label}</option>
                          ))}
                        </select>
                        <ChevronDown className="h-2.5 w-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
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
