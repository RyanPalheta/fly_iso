'use client'

import { useState, useTransition } from 'react'
import { Plus, CheckCircle2, Clock, Circle, Loader2, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createAcao, updateAcaoStatus } from '@/lib/actions/capa'
import { effectiveAcaoStatus } from '@/lib/utils/acoes-utils'
import type { AcaoComResponsavel } from '@/lib/queries/capas'
import type { UsuarioBasico } from '@/lib/queries/areas'

interface PlanoAcaoTableProps {
  capaId: string
  acoes: AcaoComResponsavel[]
  usuarios: UsuarioBasico[]
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

export function PlanoAcaoTable({ capaId, acoes, usuarios }: Readonly<PlanoAcaoTableProps>) {
  const [showForm, setShowForm]   = useState(false)
  const [descricao, setDescricao] = useState('')
  const [respId, setRespId]       = useState(usuarios[0]?.id ?? '')
  const [prazo, setPrazo]         = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
    const next = acao.status === 'pendente' ? 'em_andamento'
      : acao.status === 'em_andamento' ? 'concluida'
      : 'pendente'
    startTransition(async () => {
      await updateAcaoStatus(acao.id, capaId, next as 'pendente' | 'em_andamento' | 'concluida' | 'cancelada')
    })
  }

  const concluidas = acoes.filter((a) => a.status === 'concluida').length

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {acoes.length > 0 && (
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>Progresso do Plano</span>
            <span>{concluidas}/{acoes.length} concluídas</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${acoes.length ? (concluidas / acoes.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="space-y-2">
        {acoes.map((acao) => {
          // Status efetivo = persistido OU 'atrasada' (calculado por prazo)
          const statusEf = effectiveAcaoStatus(acao.status as 'pendente' | 'em_andamento' | 'concluida' | 'cancelada', acao.prazo)
          const sm = STATUS_ICON[statusEf as keyof typeof STATUS_ICON] ?? STATUS_ICON.pendente
          const StatusIcon = sm.icon
          const isAtrasada = statusEf === 'atrasada'

          return (
            <div
              key={acao.id}
              className={cn(
                'flex items-start gap-4 p-4 rounded-xl border transition-all',
                statusEf === 'concluida' ? 'bg-emerald-50/30 border-emerald-100 opacity-70'
                  : isAtrasada ? 'bg-red-50/40 border-red-200 ring-1 ring-red-100'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              )}
            >
              <button
                type="button"
                onClick={() => handleStatusToggle(acao)}
                className="mt-0.5 shrink-0"
                title={`${sm.label} — clique para avançar`}
              >
                <StatusIcon className={cn('h-5 w-5', sm.cls)} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn(
                    'text-sm font-semibold',
                    statusEf === 'concluida' ? 'line-through text-slate-400' : 'text-slate-900'
                  )}>
                    {acao.descricao}
                  </p>
                  {isAtrasada && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-red-100 text-red-700">
                      Atrasada
                    </span>
                  )}
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
              </div>
            </div>
          )
        })}
      </div>

      {/* Add form */}
      {showForm ? (
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
      )}
    </div>
  )
}
