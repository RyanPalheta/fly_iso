'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { ArrowLeft, CheckCircle2, Clock, XCircle, Users2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateParticipanteStatus, registrarAceiteDigital } from '@/lib/actions/treinamentos'
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
