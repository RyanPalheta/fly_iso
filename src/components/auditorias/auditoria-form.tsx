'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Check, ClipboardCheck, Users, Building2, Calendar, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createAuditoria } from '@/lib/actions/auditorias'
import type { ChecklistRow } from '@/lib/queries/auditorias'
import type { AreaComUnidade, UsuarioBasico } from '@/lib/queries/areas'
import type { AuditoriaTipo } from '@/types/database'

interface Props {
  checklists: ChecklistRow[]
  areas:      AreaComUnidade[]
  usuarios:   UsuarioBasico[]
}

const TIPOS: Array<{ value: AuditoriaTipo; label: string; desc: string }> = [
  { value: 'interna',    label: 'Interna',           desc: 'Auditoria do SGQ (ISO 9001 §9.2)' },
  { value: '5s',         label: '5S',                desc: 'Auditoria de postos de trabalho' },
  { value: 'fornecedor', label: 'Fornecedor',        desc: 'Avaliação de fornecedor crítico' },
  { value: 'seguranca',  label: 'Segurança',         desc: 'Auditoria de SST / NRs' },
  { value: 'externa',    label: 'Externa (cliente)', desc: 'Auditoria realizada por cliente / certificadora' },
]

export function AuditoriaForm({ checklists, areas, usuarios }: Readonly<Props>) {
  const router = useRouter()
  const [titulo, setTitulo]             = useState('')
  const [tipo, setTipo]                 = useState<AuditoriaTipo>('interna')
  const [escopo, setEscopo]             = useState('')
  const [criterios, setCriterios]       = useState('')
  const [dataPlanejada, setData]        = useState('')
  const [auditorLiderId, setLider]      = useState('')
  const [auditores, setAuditores]       = useState<string[]>([])
  const [areaId, setAreaId]             = useState('')
  const [checklistIds, setChecklistIds] = useState<string[]>([])

  const [error, setError]   = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'
  const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5'

  const toggleAuditor = (id: string) => {
    setAuditores((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }
  const toggleChecklist = (id: string) => {
    setChecklistIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const handleSubmit = async () => {
    setError(null)
    if (!titulo.trim()) { setError('Título obrigatório.'); return }
    if (checklistIds.length === 0) { setError('Selecione ao menos um checklist.'); return }

    setPending(true)
    const result = await createAuditoria({
      titulo, tipo, escopo, criterios,
      dataPlanejada,
      auditorLiderId: auditorLiderId || undefined,
      auditores,
      areaId: areaId || undefined,
      checklistIds,
    })
    setPending(false)
    if (!result.ok) { setError(result.error ?? 'Erro.'); return }
    router.push(`/auditorias/${result.id}`)
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

        {/* 01. Tipo */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            <span className="text-blue-700">01.</span> Tipo de Auditoria
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TIPOS.map((t) => (
              <button key={t.value} type="button" onClick={() => setTipo(t.value)}
                className={cn(
                  'p-3 rounded-xl text-left transition-all',
                  tipo === t.value
                    ? 'bg-blue-50 ring-2 ring-blue-300'
                    : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                )}>
                <p className={cn('text-sm font-bold', tipo === t.value ? 'text-blue-800' : 'text-slate-700')}>{t.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 02. Identificação */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="text-blue-700">02.</span> Identificação
          </label>
          <div>
            <label className={labelCls}>Título *</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Auditoria Interna ISO 9001 — Cláusula 7 — Q2/2026"
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Escopo</label>
            <textarea rows={2} value={escopo} onChange={(e) => setEscopo(e.target.value)}
              placeholder="Ex: Áreas auditadas: Produção, Qualidade. Cláusulas 7 e 8 da ISO 9001."
              className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Critérios</label>
            <textarea rows={2} value={criterios} onChange={(e) => setCriterios(e.target.value)}
              placeholder="Ex: ISO 9001:2015 + Procedimentos PCQ-001, PCQ-002 + Política da Qualidade"
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* 03. Checklists */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            <span className="text-blue-700">03.</span> Checklists a Aplicar ({checklistIds.length} selecionado{checklistIds.length === 1 ? '' : 's'})
          </label>
          {checklists.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Nenhum checklist cadastrado. <a href="/auditorias/checklists/novo" className="text-blue-700 hover:underline">Crie um checklist primeiro</a>.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {checklists.map((c) => {
                const selected = checklistIds.includes(c.id)
                return (
                  <button key={c.id} type="button" onClick={() => toggleChecklist(c.id)}
                    className={cn(
                      'p-3 rounded-xl text-left transition-all flex items-start gap-3',
                      selected
                        ? 'bg-emerald-50 ring-2 ring-emerald-300'
                        : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                    )}>
                    <div className={cn(
                      'w-5 h-5 rounded-md shrink-0 flex items-center justify-center mt-0.5',
                      selected ? 'bg-emerald-600 text-white' : 'bg-white ring-1 ring-slate-300'
                    )}>
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 tracking-widest">{c.codigo}</p>
                      <p className={cn('text-sm font-bold', selected ? 'text-emerald-900' : 'text-slate-700')}>{c.nome}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <BookOpen className="h-2.5 w-2.5 inline mr-1" />
                        {c.perguntas.length} pergunta{c.perguntas.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 04. Equipe */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="text-blue-700">04.</span> Equipe Auditora
          </label>
          <div>
            <label className={labelCls}>Auditor Líder</label>
            <select value={auditorLiderId} onChange={(e) => setLider(e.target.value)}
              className={`${inputCls} cursor-pointer`}>
              <option value="">— Selecionar —</option>
              {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Auditores ({auditores.length} selecionado{auditores.length === 1 ? '' : 's'})</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {usuarios.filter((u) => u.id !== auditorLiderId).map((u) => {
                const selected = auditores.includes(u.id)
                return (
                  <button key={u.id} type="button" onClick={() => toggleAuditor(u.id)}
                    className={cn(
                      'p-2 rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2',
                      selected ? 'bg-blue-50 ring-1 ring-blue-300 text-blue-800'
                               : 'bg-slate-50 ring-1 ring-slate-200 text-slate-700 hover:bg-slate-100'
                    )}>
                    <div className={cn(
                      'w-4 h-4 rounded-md shrink-0 flex items-center justify-center',
                      selected ? 'bg-blue-600 text-white' : 'bg-white ring-1 ring-slate-300'
                    )}>
                      {selected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    {u.nome}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} disabled={pending}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={pending}
            className="bg-gradient-to-br from-blue-700 to-blue-600 hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md disabled:opacity-50 flex items-center gap-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
            Programar Auditoria
          </button>
        </div>
      </section>

      <aside className="w-72 shrink-0 space-y-5 sticky top-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planejamento</h3>
          <div>
            <label className={labelCls}>
              <Calendar className="h-2.5 w-2.5 inline mr-0.5" /> Data Planejada
            </label>
            <input type="date" value={dataPlanejada} onChange={(e) => setData(e.target.value)}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>
              <Building2 className="h-2.5 w-2.5 inline mr-0.5" /> Área Principal
            </label>
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)}
              className={`${inputCls} cursor-pointer`}>
              <option value="">— Selecionar —</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}{a.unidade ? ` · ${a.unidade.nome}` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-5 ring-1 ring-blue-200/40">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-700" />
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Independência</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            O auditor não deve auditar seu próprio trabalho (ISO 9001 §9.2.2 c).
            Garanta independência ao escolher a equipe.
          </p>
        </div>
      </aside>
    </div>
  )
}
