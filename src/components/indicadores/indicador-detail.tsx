'use client'

import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Target, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calcSemaforo } from '@/lib/utils/indicadores-utils'
import type { IndicadorComRelacoes, ResultadoRow } from '@/lib/queries/indicadores'
import { ResultadoForm } from '@/components/indicadores/resultado-form'

interface IndicadorDetailProps {
  indicador: IndicadorComRelacoes
  resultados: ResultadoRow[]
}

const SEMAFORO_CONFIG = {
  verde:    { label: 'No Alvo',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: TrendingUp },
  amarelo:  { label: 'Atenção',  bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   icon: Minus },
  vermelho: { label: 'Crítico',  bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     icon: TrendingDown },
  sem_dado: { label: 'Sem dado', bg: 'bg-slate-50',   text: 'text-slate-500',   dot: 'bg-slate-300',   icon: Minus },
}

const FREQ_LABEL: Record<string, string> = {
  mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Mini sparkline rendered as SVG from result values */
function Sparkline({ resultados, meta }: { resultados: ResultadoRow[]; meta: number | null }) {
  const sorted = [...resultados].sort((a, b) => a.periodo.localeCompare(b.periodo)).slice(-12)
  if (sorted.length < 2) return null

  const values = sorted.map((r) => r.valor)
  const min = Math.min(...values, meta ?? Infinity) * 0.9
  const max = Math.max(...values, meta ?? -Infinity) * 1.1
  const range = max - min || 1

  const w = 300, h = 80
  const pts = sorted.map((r, i) => {
    const x = (i / (sorted.length - 1)) * w
    const y = h - ((r.valor - min) / range) * h
    return `${x},${y}`
  })

  const metaY = meta !== null ? h - ((meta - min) / range) * h : null

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      {/* Meta line */}
      {metaY !== null && (
        <line x1={0} y1={metaY} x2={w} y2={metaY} stroke="#d97706" strokeWidth={1.5} strokeDasharray="4 3" />
      )}
      {/* Value area */}
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="#2563eb"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Dots */}
      {sorted.map((r, i) => {
        const x = (i / (sorted.length - 1)) * w
        const y = h - ((r.valor - min) / range) * h
        return <circle key={r.id} cx={x} cy={y} r={3} fill="#2563eb" />
      })}
    </svg>
  )
}

export function IndicadorDetail({ indicador, resultados }: Readonly<IndicadorDetailProps>) {
  const semaforo = calcSemaforo(indicador.ultimo_resultado?.valor ?? null, indicador.meta)
  const { label, bg, text, dot, icon: Icon } = SEMAFORO_CONFIG[semaforo]

  const pctMeta = indicador.meta && indicador.ultimo_resultado
    ? Math.round((indicador.ultimo_resultado.valor / indicador.meta) * 100)
    : null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-sm">
        <Link href="/indicadores" className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" />
          Indicadores
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">{indicador.codigo ?? indicador.nome}</span>
      </div>

      <div className="flex gap-8 items-start">
        {/* Left */}
        <section className="flex-1 min-w-0 space-y-6">
          {/* Header card */}
          <div className={cn('rounded-2xl p-6 shadow-sm ring-1 ring-black/5', bg)}>
            <div className="flex items-center gap-3 mb-4">
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', bg, text)}>
                <span className={cn('w-2 h-2 rounded-full', dot)} />
                {label}
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">{indicador.codigo}</span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">{indicador.nome}</h1>
            {indicador.descricao && (
              <p className="text-sm text-slate-600 leading-relaxed mt-2">{indicador.descricao}</p>
            )}

            {indicador.formula && (
              <div className="mt-4 px-4 py-3 bg-white/70 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fórmula</p>
                <p className="text-sm font-mono text-slate-700">{indicador.formula}</p>
              </div>
            )}
          </div>

          {/* Last result highlight */}
          {indicador.ultimo_resultado ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Último Resultado</h2>
              <div className="flex items-end gap-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Valor ({indicador.ultimo_resultado.periodo})
                  </p>
                  <div className="flex items-end gap-2">
                    <span className={cn('text-4xl font-extrabold', text)}>
                      {indicador.ultimo_resultado.valor}
                    </span>
                    {indicador.unidade_medida && (
                      <span className="text-lg font-bold text-slate-400 mb-1">{indicador.unidade_medida}</span>
                    )}
                  </div>
                </div>
                {indicador.meta !== null && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Meta</p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-extrabold text-slate-300">{indicador.meta}</span>
                      {indicador.unidade_medida && (
                        <span className="text-lg font-bold text-slate-300 mb-1">{indicador.unidade_medida}</span>
                      )}
                    </div>
                  </div>
                )}
                {pctMeta !== null && (
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">% da meta</p>
                      <span className={cn('text-sm font-extrabold', text)}>{pctMeta}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', semaforo === 'verde' ? 'bg-emerald-500' : semaforo === 'amarelo' ? 'bg-amber-400' : 'bg-red-500')}
                        style={{ width: `${Math.min(pctMeta, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Icon className={cn('h-3.5 w-3.5', text)} />
                      <span className={cn('text-xs font-bold', text)}>{label}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 text-center">
              <Target className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Nenhum resultado lançado</p>
              <p className="text-xs text-slate-400 mt-1">Lance o primeiro resultado abaixo</p>
            </div>
          )}

          {/* Sparkline */}
          {resultados.length >= 2 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Evolução Histórica</h2>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5 bg-blue-600" /> Valor</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5 border-t-2 border-dashed border-amber-400" /> Meta</span>
                </div>
              </div>
              <Sparkline resultados={resultados} meta={indicador.meta} />
            </div>
          )}

          {/* Lançar resultado */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Lançamento de Resultado</h2>
              {indicador.gerar_nc_abaixo_meta && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  Auto-NC ativa
                </span>
              )}
            </div>
            <ResultadoForm indicador={indicador} />
          </div>

          {/* Historical table */}
          {resultados.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Histórico de Resultados</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Período', 'Valor', '% Meta', 'Status', 'NC Gerada', 'Registrado em'].map((h) => (
                        <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 first:pl-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((r) => {
                      const s = calcSemaforo(r.valor, indicador.meta)
                      const pct = indicador.meta ? Math.round((r.valor / indicador.meta) * 100) : null
                      const { label: sl, text: st } = SEMAFORO_CONFIG[s]
                      return (
                        <tr key={r.id} className="border-b border-slate-50">
                          <td className="px-4 py-3 pl-0 font-mono text-xs font-bold text-slate-700">{r.periodo}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {r.valor} {indicador.unidade_medida ?? ''}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{pct !== null ? `${pct}%` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={cn('text-[10px] font-bold', st)}>{sl}</span>
                          </td>
                          <td className="px-4 py-3">
                            {r.nc_gerada_id ? (
                              <Link href={`/nao-conformidades/${r.nc_gerada_id}`} className="text-xs text-blue-700 font-bold hover:underline">
                                Ver NC
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(r.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Right sidebar */}
        <aside className="w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Informações</h3>
            <dl className="space-y-0">
              {[
                { label: 'Código',      value: indicador.codigo ?? '—' },
                { label: 'Área',        value: indicador.areas?.nome ?? '—' },
                { label: 'Responsável', value: indicador.responsavel?.nome ?? '—' },
                { label: 'Meta',        value: indicador.meta !== null ? `${indicador.meta} ${indicador.unidade_medida ?? ''}`.trim() : '—' },
                { label: 'Frequência',  value: FREQ_LABEL[indicador.frequencia ?? ''] ?? indicador.frequencia ?? '—' },
                { label: 'Status',      value: indicador.ativo ? 'Ativo' : 'Inativo' },
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
