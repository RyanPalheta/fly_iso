'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit3, ExternalLink, Info, Lock, RotateCcw, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/status-badge'
import { CausaRaizSelector } from '@/components/capa/causa-raiz-selector'
import { PlanoAcaoTable } from '@/components/capa/plano-acao-table'
import { reabrirCapa } from '@/lib/actions/capa'
import type { CapaComRelacoes, AcaoComResponsavel } from '@/lib/queries/capas'
import type { UsuarioBasico } from '@/lib/queries/areas'
import type { CapaStatus } from '@/types/database'

interface CapaDetailProps {
  capa: CapaComRelacoes
  acoes: AcaoComResponsavel[]
  usuarios: UsuarioBasico[]
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_FLOW: { status: CapaStatus; label: string }[] = [
  { status: 'aberta',          label: 'Aberta' },
  { status: 'em_investigacao', label: 'Em Investigação' },
  { status: 'plano_definido',  label: 'Plano Definido' },
  { status: 'em_execucao',     label: 'Em Execução' },
  { status: 'verificacao',     label: 'Verificação' },
  { status: 'encerrada',       label: 'Encerrada' },
]

const STATUS_ORDER: Record<CapaStatus, number> = {
  aberta: 0, em_investigacao: 1, plano_definido: 2,
  em_execucao: 3, verificacao: 4, encerrada: 5, reaberta: 1,
}

export function CapaDetail({ capa, acoes, usuarios }: Readonly<CapaDetailProps>) {
  const router = useRouter()
  const currentOrder = STATUS_ORDER[capa.status] ?? 0
  const isEncerrada = capa.status === 'encerrada'
  const [isReopening, startReopen] = useTransition()

  const handleReabrir = () => {
    if (!confirm('Tem certeza que deseja reabrir esta CAPA? O status voltará para "Reaberta".')) return
    startReopen(async () => {
      const result = await reabrirCapa(capa.id)
      if (!result.ok) { alert(result.error ?? 'Erro ao reabrir.'); return }
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-sm">
        <Link href="/capa" className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" />
          CAPAs
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">{capa.codigo}</span>
      </div>

      <div className="flex gap-8 items-start">
        {/* ── Left ── */}
        <section className="flex-1 min-w-0 space-y-6">
          {/* Header card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  capa.tipo === 'corretiva' ? 'bg-orange-100 text-orange-700' : 'bg-violet-100 text-violet-700'
                )}>
                  {capa.tipo === 'corretiva' ? 'Ação Corretiva' : 'Ação Preventiva'}
                </span>
                <StatusBadge status={capa.status} />
              </div>
              {!isEncerrada && (
                <button
                  type="button"
                  disabled
                  title="Edição em breve"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed px-3 py-1.5 rounded-lg"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Editar
                </button>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">{capa.codigo}</h1>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Aberta em {fmt(capa.created_at)} · Responsável: {capa.responsavel?.nome ?? '—'}
            </p>

            {capa.descricao && (
              <p className="text-sm text-slate-600 leading-relaxed">{capa.descricao}</p>
            )}

            {capa.nc && (
              <Link
                href={`/nao-conformidades/${capa.nc.id}`}
                className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-700 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                NC Vinculada: {capa.nc.codigo} — {capa.nc.titulo}
              </Link>
            )}

            {/* Banner de encerramento */}
            {isEncerrada && (
              <div className="mt-5 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <Lock className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-emerald-900">CAPA encerrada com sucesso</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    A verificação de eficácia foi aprovada e este registro está em modo somente leitura.
                    Para alterar, reabra a CAPA usando o botão na barra lateral.
                  </p>
                  {capa.encerrada_em && (
                    <p className="text-[11px] text-emerald-600 mt-1.5 font-medium">
                      Encerrada em {fmt(capa.encerrada_em)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Causa Raiz — método selecionável (5 Porquês / Ishikawa / Texto Livre) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Análise de Causa Raiz</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escolha o método mais adequado ao tipo de problema.
                </p>
              </div>
            </div>
            <CausaRaizSelector
              capaId={capa.id}
              metodo={capa.causa_raiz_metodo}
              dados={capa.causa_raiz_dados}
              readOnly={isEncerrada}
            />
          </div>

          {/* Plano de Ação */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Plano de Ação</h2>
                <p className="text-xs text-slate-500 mt-0.5">O quê · Quem · Quando</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {acoes.filter(a => a.status === 'concluida').length}/{acoes.length} concluídas
              </span>
            </div>
            <PlanoAcaoTable capaId={capa.id} acoes={acoes} usuarios={usuarios} readOnly={isEncerrada} />
          </div>
        </section>

        {/* ── Right Sidebar ── */}
        <aside className="w-80 shrink-0 space-y-5">
          {/* Progressão */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
              Progressão
            </h3>
            <div className="relative space-y-4">
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-100" />
              {STATUS_FLOW.map((step, i) => {
                const done    = i < currentOrder
                const current = i === currentOrder
                return (
                  <div key={step.status} className="relative pl-8">
                    <div className={cn(
                      'absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center',
                      current && 'bg-blue-700 ring-4 ring-blue-700/10',
                      done    && 'bg-emerald-400',
                      !current && !done && 'bg-slate-100'
                    )}>
                      <div className={cn(
                        'rounded-full',
                        current ? 'w-2 h-2 bg-white' : done ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-slate-300'
                      )} />
                    </div>
                    <p className={cn('text-xs font-bold', current ? 'text-slate-900' : done ? 'text-emerald-600' : 'text-slate-400')}>
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* CTA: Verificação (status=verificacao) */}
            {capa.status === 'verificacao' && (
              <Link
                href={`/capa/${capa.id}/verificacao`}
                className="block w-full mt-5 text-center bg-gradient-to-br from-violet-600 to-blue-700 hover:opacity-90 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm transition-opacity"
              >
                Iniciar Verificação de Eficácia →
              </Link>
            )}

            {/* CTA: Reabrir (status=encerrada) */}
            {isEncerrada && (
              <button
                type="button"
                onClick={handleReabrir}
                disabled={isReopening}
                className="w-full mt-5 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
              >
                {isReopening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Reabrir CAPA
              </button>
            )}

            {currentOrder < STATUS_FLOW.length - 1 && capa.status !== 'verificacao' && !isEncerrada && (
              <div className="mt-5 flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2.5 ring-1 ring-slate-100">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
                <p>
                  O status avança <strong>automaticamente</strong> conforme as etapas
                  são preenchidas (causa raiz, plano de ação, conclusão das ações).
                </p>
              </div>
            )}
          </div>

          {/* Metadados */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Informações
            </h3>
            <dl className="space-y-0">
              {[
                { label: 'Código',      value: capa.codigo },
                { label: 'Tipo',        value: capa.tipo === 'corretiva' ? 'Corretiva' : 'Preventiva' },
                { label: 'Prazo',       value: fmt(capa.prazo_geral) },
                { label: 'Criada em',   value: fmt(capa.created_at) },
                { label: 'Responsável', value: capa.responsavel?.nome ?? '—' },
              ].map(({ label, value }, i, arr) => (
                <div key={label} className={`flex justify-between items-center py-2.5 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <dt className="text-xs text-slate-500 font-medium">{label}</dt>
                  <dd className="text-xs font-bold text-slate-900 text-right max-w-[55%] truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
