'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  ArrowLeft, CheckCircle2, Clock, XCircle, Users2, FileText,
  ThumbsUp, ThumbsDown, AlertCircle, Loader2, Check, Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateParticipanteStatus, registrarAceiteDigital, registrarAvaliacaoEficacia } from '@/lib/actions/treinamentos'
import type { TreinamentoComRelacoes } from '@/lib/queries/treinamentos'

interface Props { treinamento: TreinamentoComRelacoes }

const STATUS_PART = {
  pendente:  { label: 'Pendente',  cls: 'bg-slate-100 text-slate-600',   icon: Clock },
  concluido: { label: 'Concluído', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  ausente:   { label: 'Ausente',   cls: 'bg-red-100 text-red-700',        icon: XCircle },
}

const STATUS_TREIN = {
  planejado: { label: 'Planejado',  cls: 'bg-violet-100 text-violet-700' },
  realizado:  { label: 'Realizado',  cls: 'bg-emerald-100 text-emerald-700' },
  cancelado:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-700' },
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ParticipanteRow({
  p,
  treinamentoId,
}: Readonly<{ p: TreinamentoComRelacoes['treinamento_participantes'][number]; treinamentoId: string }>) {
  const [, start] = useTransition()
  const meta = STATUS_PART[p.status as keyof typeof STATUS_PART] ?? STATUS_PART.pendente
  const Icon = meta.icon

  const cycleStatus = () => {
    const next = p.status === 'pendente' ? 'concluido' : p.status === 'concluido' ? 'ausente' : 'pendente'
    start(async () => { await updateParticipanteStatus(p.id, treinamentoId, next as 'pendente' | 'concluido' | 'ausente') })
  }

  const doAceite = () => {
    start(async () => { await registrarAceiteDigital(p.id, treinamentoId) })
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
        {(p.usuario?.nome ?? 'U').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{p.usuario?.nome ?? 'Usuário desconhecido'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {p.aceite_digital && (
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Aceite digital {fmtDate(p.aceite_em)}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={cycleStatus}
        className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-opacity hover:opacity-80', meta.cls)}
      >
        <Icon className="h-3 w-3" />
        {meta.label}
      </button>
      {!p.aceite_digital && p.status !== 'ausente' && (
        <button
          type="button"
          onClick={doAceite}
          className="text-[10px] font-bold text-blue-700 hover:underline"
        >
          Aceite digital
        </button>
      )}
    </div>
  )
}

// ── Avaliação de Eficácia ──────────────────────────────────────────────────
function AvaliacaoEficaciaPanel({ treinamentoId }: Readonly<{ treinamentoId: string }>) {
  const [open, setOpen]           = useState(false)
  const [eficaz, setEficaz]       = useState<boolean | null>(null)
  const [obs, setObs]             = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [done, setDone]           = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async () => {
    if (eficaz === null) { setError('Selecione se o treinamento foi eficaz.'); return }
    if (!obs.trim())     { setError('Observação é obrigatória (req. auditor).'); return }
    if (!eficaz && obs.trim().length < 20) {
      setError('Quando ineficaz, justifique com pelo menos 20 caracteres.'); return
    }
    setIsPending(true)
    const result = await registrarAvaliacaoEficacia({ treinamentoId, eficaz, observacao: obs })
    setIsPending(false)
    if (!result.ok) { setError(result.error ?? 'Erro.'); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="bg-emerald-50 rounded-2xl p-5 ring-1 ring-emerald-200 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-800">Avaliação de eficácia registrada.</p>
          <p className="text-xs text-emerald-600 mt-0.5">Obrigado — isso atende ao requisito §7.2 da ISO 9001.</p>
        </div>
      </div>
    )
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'

  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <Award className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">Avaliação de Eficácia</p>
            <p className="text-[11px] text-slate-500">Obrigatória — ISO 9001 §7.2</p>
          </div>
        </div>
        <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2.5 py-1 rounded-full">
          {open ? 'Fechar' : 'Registrar'}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              O treinamento atingiu os objetivos pretendidos?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button"
                onClick={() => { setEficaz(true); setError(null) }}
                className={cn(
                  'flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-sm transition-all',
                  eficaz === true
                    ? 'bg-emerald-50 ring-2 ring-emerald-300 text-emerald-800'
                    : 'bg-slate-50 ring-1 ring-slate-200 text-slate-600 hover:bg-slate-100'
                )}
              >
                <ThumbsUp className="h-4 w-4" /> Sim — Eficaz
              </button>
              <button type="button"
                onClick={() => { setEficaz(false); setError(null) }}
                className={cn(
                  'flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-sm transition-all',
                  eficaz === false
                    ? 'bg-red-50 ring-2 ring-red-300 text-red-800'
                    : 'bg-slate-50 ring-1 ring-slate-200 text-slate-600 hover:bg-slate-100'
                )}
              >
                <ThumbsDown className="h-4 w-4" /> Não — Ineficaz
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Observação / Evidência <span className="text-red-500 normal-case">*</span>
              {!eficaz && eficaz !== null && (
                <span className="ml-2 normal-case text-red-600 font-normal">(mínimo 20 caracteres quando ineficaz)</span>
              )}
            </label>
            <textarea
              rows={3}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder={eficaz ? 'Descreva como o treinamento foi eficaz (indicadores, avaliação prática, etc.)' : 'Descreva por que o treinamento não atingiu os objetivos e quais ações serão tomadas.'}
              className={`${inputCls} resize-none`}
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">{obs.length} caracteres</p>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setOpen(false); setError(null) }}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
              Cancelar
            </button>
            <button type="button" onClick={handleSubmit} disabled={isPending}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Registrar Avaliação
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function TreinamentoDetail({ treinamento: t }: Readonly<Props>) {
  const statusMeta = STATUS_TREIN[t.status as keyof typeof STATUS_TREIN] ?? STATUS_TREIN.planejado
  const participantes = t.treinamento_participantes ?? []
  const concluidos = participantes.filter((p) => p.status === 'concluido').length
  const pct = participantes.length ? Math.round((concluidos / participantes.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-sm">
        <Link href="/treinamentos" className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" />
          Treinamentos
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-[300px]">{t.titulo}</span>
      </div>

      <div className="flex gap-8 items-start">
        {/* Left */}
        <section className="flex-1 min-w-0 space-y-6">
          {/* Header card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-3 mb-4">
              <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', statusMeta.cls)}>
                {statusMeta.label}
              </span>
              <span className="text-xs text-slate-400">{t.tipo}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">{t.titulo}</h1>
            {t.instrutor && (
              <p className="text-xs font-medium text-slate-500 mb-4">Instrutor: {t.instrutor}</p>
            )}
            {t.descricao && (
              <p className="text-sm text-slate-600 leading-relaxed">{t.descricao}</p>
            )}
            {t.documento && (
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-700">
                <FileText className="h-3.5 w-3.5" />
                Documento vinculado: {t.documento.codigo ? `${t.documento.codigo} — ` : ''}{t.documento.titulo}
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Participantes</h2>
                <p className="text-xs text-slate-500 mt-0.5">{concluidos}/{participantes.length} concluídos</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700">{pct}%</span>
              </div>
            </div>

            {participantes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Users2 className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                Nenhum participante cadastrado
              </div>
            ) : (
              <div>
                {participantes.map((p) => (
                  <ParticipanteRow key={p.id} p={p} treinamentoId={t.id} />
                ))}
              </div>
            )}
          </div>

          {/* Avaliação de Eficácia — aparece quando o treinamento está realizado */}
          {t.status === 'realizado' && (
            <AvaliacaoEficaciaPanel treinamentoId={t.id} />
          )}
        </section>

        {/* Sidebar */}
        <aside className="w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Informações</h3>
            <dl className="space-y-0">
              {[
                { label: 'Data',        value: fmtDate(t.data_treinamento) },
                { label: 'Validade',    value: t.validade_meses ? `${t.validade_meses} meses` : '—' },
                { label: 'Área',        value: t.areas?.nome ?? '—' },
                { label: 'Tipo',        value: t.tipo },
              ].map(({ label, value }, i, arr) => (
                <div key={label} className={`flex justify-between items-center py-2.5 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <dt className="text-xs text-slate-500 font-medium">{label}</dt>
                  <dd className="text-xs font-bold text-slate-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
