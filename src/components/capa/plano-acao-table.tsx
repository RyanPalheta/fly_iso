'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, CheckCircle2, Clock, Circle, Loader2, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Paperclip, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createAcao, updateAcaoStatus } from '@/lib/actions/capa'
import { effectiveAcaoStatus } from '@/lib/utils/acoes-utils'
import { AcaoEvidencias } from '@/components/capa/acao-evidencias'
import type { AcaoComResponsavel } from '@/lib/queries/capas'
import type { UsuarioBasico } from '@/lib/queries/areas'

type AcaoStatusReal = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'

interface PlanoAcaoTableProps {
  capaId: string
  acoes: AcaoComResponsavel[]
  usuarios: UsuarioBasico[]
  /** Quando true: bloqueia criação/edição (CAPA encerrada). */
  readOnly?: boolean
}

const STATUS_ICON = {
  pendente:    { icon: Circle,         cls: 'text-slate-400',   label: 'Pendente' },
  em_andamento:{ icon: Clock,          cls: 'text-amber-500',   label: 'Em Execução' },
  concluida:   { icon: CheckCircle2,   cls: 'text-emerald-500', label: 'Concluída' },
  cancelada:   { icon: XCircle,        cls: 'text-slate-300',   label: 'Cancelada' },
  atrasada:    { icon: AlertTriangle,  cls: 'text-red-500',     label: 'Atrasada' },
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function PlanoAcaoTable({ capaId, acoes, usuarios, readOnly }: Readonly<PlanoAcaoTableProps>) {
  const router = useRouter()
  const [showForm, setShowForm]   = useState(false)
  const [descricao, setDescricao] = useState('')
  const [respId, setRespId]       = useState(usuarios[0]?.id ?? '')
  const [prazo, setPrazo]         = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Estado local com optimistic updates
  const [localAcoes, setLocalAcoes] = useState<AcaoComResponsavel[]>(acoes)
  useEffect(() => { setLocalAcoes(acoes) }, [acoes])

  const handleAdd = () => {
    if (!descricao.trim() || !respId || !prazo) { setError('Preencha todos os campos.'); return }
    setError(null)
    startTransition(async () => {
      const result = await createAcao({ capaId, descricao, responsavelId: respId, prazo })
      if (!result.ok) { setError(result.error ?? 'Erro.'); return }
      setDescricao(''); setPrazo(''); setShowForm(false)
    })
  }

  const handleStatusToggle = (acao: AcaoComResponsavel) => {
    const next: AcaoStatusReal = acao.status === 'pendente' ? 'em_andamento'
      : acao.status === 'em_andamento' ? 'concluida'
      : 'pendente'

    // 1) Optimistic update — UI muda na hora
    setLocalAcoes((prev) =>
      prev.map((a) => a.id === acao.id ? { ...a, status: next } : a)
    )

    // 2) Server confirma em background; em caso de erro, revalida (router.refresh)
    startTransition(async () => {
      const result = await updateAcaoStatus(acao.id, capaId, next)
      if (!result.ok) {
        // Reverte e mostra erro
        setLocalAcoes((prev) =>
          prev.map((a) => a.id === acao.id ? { ...a, status: acao.status } : a)
        )
        setError(result.error ?? 'Erro ao atualizar.')
      } else {
        // Sucesso → recarrega para sincronizar status do CAPA (que pode ter mudado)
        router.refresh()
      }
    })
  }

  const concluidas = localAcoes.filter((a) => a.status === 'concluida').length

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {localAcoes.length > 0 && (
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>Progresso do Plano</span>
            <span>{concluidas}/{localAcoes.length} concluídas</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${localAcoes.length ? (concluidas / localAcoes.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="space-y-2">
        {localAcoes.map((acao) => {
          // Status efetivo = persistido OU 'atrasada' (calculado por prazo)
          const statusEf = effectiveAcaoStatus(acao.status as AcaoStatusReal, acao.prazo)
          const sm = STATUS_ICON[statusEf as keyof typeof STATUS_ICON] ?? STATUS_ICON.pendente
          const StatusIcon = sm.icon
          const isAtrasada = statusEf === 'atrasada'

          // Conta evidências para mostrar badge
          const numEvidencias = Array.isArray(acao.evidencia_urls)
            ? (acao.evidencia_urls as unknown[]).length
            : 0
          const isExpanded = expandedId === acao.id
          const hasContent = numEvidencias > 0 || !!acao.observacao?.trim()

          return (
            <div
              key={acao.id}
              className={cn(
                'rounded-xl border transition-all',
                statusEf === 'concluida' ? 'bg-emerald-50/30 border-emerald-100'
                  : isAtrasada ? 'bg-red-50/40 border-red-200 ring-1 ring-red-100'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              )}
            >
              <div className="flex items-start gap-4 p-4">
                <button
                  type="button"
                  onClick={() => !readOnly && handleStatusToggle(acao)}
                  disabled={readOnly}
                  className={cn('mt-0.5 shrink-0', readOnly ? 'cursor-not-allowed' : 'cursor-pointer')}
                  title={readOnly ? 'CAPA encerrada — somente leitura' : `${sm.label} — clique para avançar`}
                >
                  <StatusIcon className={cn('h-5 w-5', sm.cls)} />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      'text-sm font-semibold',
                      statusEf === 'concluida' ? 'line-through text-slate-500' : 'text-slate-900'
                    )}>
                      {acao.descricao}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {isAtrasada && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-red-100 text-red-700">
                          Atrasada
                        </span>
                      )}
                      {numEvidencias > 0 && (
                        <span
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700"
                          title={`${numEvidencias} evidência(s)`}
                        >
                          <Paperclip className="h-2.5 w-2.5" />
                          {numEvidencias}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {acao.responsavel?.nome ?? '—'}
                    </span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className={cn(
                      'text-[10px] font-semibold',
                      isAtrasada ? 'text-red-600' : 'text-slate-400'
                    )}>
                      {fmt(acao.prazo)}
                    </span>
                  </div>

                  {/* Expand toggle */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : acao.id)}
                    className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-700 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isExpanded
                      ? 'Ocultar evidências'
                      : hasContent
                        ? `${numEvidencias > 0 ? `${numEvidencias} evidência(s) · ` : ''}${acao.observacao ? 'observação' : ''}`.trim().replace(/·\s*$/, '') + ' — ver detalhes'
                        : 'Adicionar evidências / observação'}
                  </button>
                </div>
              </div>

              {/* Conteúdo expandido */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <AcaoEvidencias
                    acaoId={acao.id}
                    capaId={capaId}
                    evidenciasRaw={acao.evidencia_urls}
                    observacao={acao.observacao}
                    readOnly={readOnly}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Banner de bloqueio quando readOnly */}
      {readOnly && (
        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <p>
            CAPA encerrada — somente leitura. Reabra para fazer alterações.
          </p>
        </div>
      )}

      {/* Add form (oculto se readOnly) */}
      {!readOnly && (showForm ? (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
          <textarea
            rows={2}
            placeholder="Descreva a ação a ser executada..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={respId}
              onChange={(e) => setRespId(e.target.value)}
              className="px-3 py-2 bg-white rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none cursor-pointer"
            >
              {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
            <input
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="px-3 py-2 bg-white rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Adicionar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nova Ação
        </button>
      ))}
    </div>
  )
}
