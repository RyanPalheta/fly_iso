'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Clock, PlayCircle, AlertTriangle, AlertCircle,
  FileText, ChevronDown, ChevronRight, Flag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  responderPergunta, updateAuditoriaStatus, criarNCdaResposta,
} from '@/lib/actions/auditorias'
import type { AuditoriaComRelacoes, RespostaRow } from '@/lib/queries/auditorias'
import type { AuditoriaPergunta, AuditoriaStatus } from '@/types/database'

interface Props {
  auditoria:         AuditoriaComRelacoes
  respostasIniciais: RespostaRow[]
}

const STATUS_META = {
  planejada:   { label: 'Planejada',   cls: 'bg-slate-100 text-slate-600',     icon: Clock },
  em_execucao: { label: 'Em execução', cls: 'bg-amber-100 text-amber-700',     icon: PlayCircle },
  concluida:   { label: 'Concluída',   cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelada:   { label: 'Cancelada',   cls: 'bg-red-100 text-red-500',         icon: AlertTriangle },
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function AuditoriaExec({ auditoria: a, respostasIniciais }: Readonly<Props>) {
  const router = useRouter()
  const [respostas, setRespostas] = useState<RespostaRow[]>(respostasIniciais)
  const [, startTrans] = useTransition()
  const [expandido, setExpandido] = useState<string | null>(a.checklists[0]?.id ?? null)

  const statusMeta = STATUS_META[a.status] ?? STATUS_META.planejada
  const StatusIcon = statusMeta.icon

  const respostaFor = (checklistId: string, perguntaId: string) =>
    respostas.find((r) => r.checklist_id === checklistId && r.pergunta_id === perguntaId)

  const handleResponder = async (
    checklistId: string, p: AuditoriaPergunta, valor: string, observacao?: string
  ) => {
    const result = await responderPergunta({
      auditoriaId:   a.id,
      checklistId,
      perguntaId:    p.id,
      respostaValor: valor,
      observacao,
    })
    if (result.ok) router.refresh()
  }

  const handleChangeStatus = (next: AuditoriaStatus) => {
    startTrans(async () => {
      await updateAuditoriaStatus(a.id, next)
      router.refresh()
    })
  }

  const handleCriarNC = async (respostaId: string, severidade: 'menor' | 'maior' | 'critica') => {
    const result = await criarNCdaResposta(respostaId, severidade)
    if (result.ok) router.refresh()
  }

  // Cálculo de progresso
  const totalPerguntas = a.checklists.reduce((sum, c) => sum + c.perguntas.length, 0)
  const respondidas = respostas.filter((r) => r.resposta_valor).length
  const pctProgresso = totalPerguntas > 0 ? Math.round((respondidas / totalPerguntas) * 100) : 0
  const pctScore = a.pontuacao_max > 0 ? Math.round((a.pontuacao_total / a.pontuacao_max) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-slate-500">{a.codigo}</span>
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', statusMeta.cls)}>
                <StatusIcon className="h-2.5 w-2.5" /> {statusMeta.label}
              </span>
              <span className="text-xs text-slate-400 uppercase">{a.tipo}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{a.titulo}</h1>
            {a.escopo && <p className="text-sm text-slate-600 mt-2">{a.escopo}</p>}
            {a.criterios && (
              <p className="text-xs text-slate-500 mt-2"><strong>Critérios:</strong> {a.criterios}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {a.status === 'planejada' && (
              <button type="button" onClick={() => handleChangeStatus('em_execucao')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold">
                <PlayCircle className="h-4 w-4" /> Iniciar Auditoria
              </button>
            )}
            {a.status === 'em_execucao' && (
              <button type="button" onClick={() => handleChangeStatus('concluida')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold">
                <CheckCircle2 className="h-4 w-4" /> Concluir
              </button>
            )}
          </div>
        </div>

        {/* Metadata */}
        <dl className="mt-6 grid grid-cols-4 gap-x-6 gap-y-3 pt-5 border-t border-slate-100">
          {[
            { label: 'Auditor líder', value: a.auditor_lider?.nome ?? '—' },
            { label: 'Equipe',        value: `${a.auditores.length} auditor(es)` },
            { label: 'Área',          value: a.area?.nome ?? '—' },
            { label: 'Data planejada', value: fmtDate(a.data_planejada) },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</dt>
              <dd className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Progress bars */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Progresso</span>
              <span className="text-xs font-bold text-blue-700">{respondidas}/{totalPerguntas} ({pctProgresso}%)</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pctProgresso}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Pontuação</span>
              <span className="text-xs font-bold text-emerald-700">{a.pontuacao_total}/{a.pontuacao_max} ({pctScore}%)</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={cn(
                'h-full rounded-full transition-all',
                pctScore >= 80 ? 'bg-emerald-500' :
                pctScore >= 60 ? 'bg-amber-500' :
                'bg-red-500'
              )} style={{ width: `${pctScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Checklists */}
      {a.checklists.map((c) => {
        const isExpanded = expandido === c.id
        const respondidasC = c.perguntas.filter((p) => respostaFor(c.id, p.id)?.resposta_valor).length
        return (
          <div key={c.id} className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden">
            <button type="button"
              onClick={() => setExpandido(isExpanded ? null : c.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest">{c.codigo}</p>
                  <p className="text-sm font-bold text-slate-900">{c.nome}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-600">
                  {respondidasC}/{c.perguntas.length}
                </span>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {c.perguntas.map((p, idx) => {
                  const resp = respostaFor(c.id, p.id)
                  return (
                    <PerguntaItem
                      key={p.id}
                      idx={idx}
                      pergunta={p}
                      resposta={resp}
                      podeResponder={a.status === 'em_execucao'}
                      onResponder={(v, obs) => handleResponder(c.id, p, v, obs)}
                      onCriarNC={resp ? (sev) => handleCriarNC(resp.id, sev) : undefined}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Pergunta individual ───────────────────────────────────────────────────────
function PerguntaItem({
  idx, pergunta: p, resposta, podeResponder, onResponder, onCriarNC,
}: Readonly<{
  idx:           number
  pergunta:      AuditoriaPergunta
  resposta:      RespostaRow | undefined
  podeResponder: boolean
  onResponder:   (valor: string, observacao?: string) => void
  onCriarNC?:    (sev: 'menor' | 'maior' | 'critica') => void
}>) {
  const [obs, setObs] = useState(resposta?.observacao ?? '')
  const [showNC, setShowNC] = useState(false)
  const respValor = resposta?.resposta_valor

  // Cor visual da resposta
  const opcaoSel = p.opcoes.find((o) => o.valor === respValor)
  const isCritica = respValor === 'nc_menor' || respValor === 'nc_maior'

  return (
    <div className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded shrink-0 tabular-nums">
          #{String(idx + 1).padStart(2, '0')}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 leading-relaxed">{p.texto}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
            {p.clausula && <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">§{p.clausula}</span>}
            <span>peso {p.peso}</span>
            {p.obrigatoria && <span className="text-red-600 font-bold">Obrigatória</span>}
          </div>
        </div>
      </div>

      {/* Opções de resposta */}
      <div className="flex flex-wrap gap-2 mb-3">
        {p.opcoes.map((o) => {
          const isSel = respValor === o.valor
          return (
            <button key={o.valor} type="button"
              disabled={!podeResponder}
              onClick={() => onResponder(o.valor, obs || undefined)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                isSel
                  ? (o.valor.includes('nc') ? 'bg-red-600 text-white' :
                     o.valor === 'conforme' || o.valor === 'otimo' ? 'bg-emerald-600 text-white' :
                     o.valor === 'observacao' ? 'bg-amber-500 text-white' :
                     'bg-slate-700 text-white')
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                !podeResponder && 'opacity-50 cursor-not-allowed'
              )}>
              {o.label}
              {o.pontos !== null && <span className="ml-1 opacity-70">({o.pontos}pt)</span>}
            </button>
          )
        })}
      </div>

      {/* Observação + evidência */}
      {podeResponder && (
        <div className="space-y-2">
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Observação / evidência..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white resize-none"
            onBlur={() => respValor && onResponder(respValor, obs)}
          />
        </div>
      )}

      {!podeResponder && resposta && (
        <>
          {resposta.observacao && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 mt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Observação</p>
              {resposta.observacao}
            </div>
          )}
          {opcaoSel && (
            <p className="text-[10px] text-slate-500 mt-2">
              Pontos: <strong>{resposta.pontos ?? '—'}</strong>
            </p>
          )}
        </>
      )}

      {/* Botão criar NC */}
      {isCritica && podeResponder && onCriarNC && !resposta?.nc_id && (
        <div className="mt-3 pt-3 border-t border-red-100">
          {!showNC ? (
            <button type="button" onClick={() => setShowNC(true)}
              className="flex items-center gap-2 text-xs font-bold text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg">
              <Flag className="h-3 w-3" /> Abrir NC a partir deste item
            </button>
          ) : (
            <div className="bg-red-50 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-xs text-red-900 font-semibold mr-2">Severidade:</p>
              {(['menor', 'maior', 'critica'] as const).map((sev) => (
                <button key={sev} type="button" onClick={() => { onCriarNC(sev); setShowNC(false) }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded">
                  {sev === 'menor' ? 'Menor' : sev === 'maior' ? 'Maior' : 'Crítica'}
                </button>
              ))}
              <button type="button" onClick={() => setShowNC(false)} className="text-xs text-slate-500 hover:text-slate-700 ml-2">
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {resposta?.nc_id && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-emerald-700 font-bold">NC gerada</span>
          <a href={`/nao-conformidades/${resposta.nc_id}`} className="text-blue-700 hover:underline font-semibold">Ver NC →</a>
        </div>
      )}
    </div>
  )
}
