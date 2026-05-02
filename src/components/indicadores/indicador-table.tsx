'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { Plus, TrendingUp, TrendingDown, Minus, Power } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calcSemaforo } from '@/lib/utils/indicadores-utils'
import type { IndicadorComRelacoes } from '@/lib/queries/indicadores'
import { toggleIndicadorAtivo } from '@/lib/actions/indicadores'

interface IndicadorTableProps {
  indicadores: IndicadorComRelacoes[]
}

const SEMAFORO_META = {
  verde:    { label: 'No alvo',  cls: 'bg-emerald-100 text-emerald-700', icon: TrendingUp },
  amarelo:  { label: 'Atenção',  cls: 'bg-amber-100 text-amber-700',    icon: Minus },
  vermelho: { label: 'Crítico',  cls: 'bg-red-100 text-red-700',        icon: TrendingDown },
  sem_dado: { label: 'Sem dado', cls: 'bg-slate-100 text-slate-500',    icon: Minus },
}

const FREQ_LABEL: Record<string, string> = {
  mensal:      'Mensal',
  trimestral:  'Trimestral',
  semestral:   'Semestral',
  anual:       'Anual',
}

function SemaforoCircle({ s }: { s: 'verde' | 'amarelo' | 'vermelho' | 'sem_dado' }) {
  const colors = {
    verde:    'bg-emerald-500',
    amarelo:  'bg-amber-400',
    vermelho: 'bg-red-500',
    sem_dado: 'bg-slate-300',
  }
  return (
    <span className={cn('inline-block w-3 h-3 rounded-full', colors[s])} />
  )
}

function ToggleButton({ id, ativo }: Readonly<{ id: string; ativo: boolean }>) {
  const [, start] = useTransition()
  return (
    <button
      type="button"
      title={ativo ? 'Desativar' : 'Ativar'}
      onClick={() => start(async () => { await toggleIndicadorAtivo(id, !ativo) })}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        ativo ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
      )}
    >
      <Power className="h-4 w-4" />
    </button>
  )
}

export function IndicadorTable({ indicadores }: Readonly<IndicadorTableProps>) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Indicadores de Desempenho</h2>
          <p className="text-xs text-slate-500 mt-0.5">{indicadores.length} indicador(es) cadastrado(s)</p>
        </div>
        <Link
          href="/indicadores/novo"
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Indicador
        </Link>
      </div>

      {indicadores.length === 0 ? (
        <div className="py-20 text-center">
          <TrendingUp className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Nenhum indicador cadastrado</p>
          <p className="text-xs text-slate-400 mt-1">Crie o primeiro indicador de desempenho</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Status', 'Código', 'Nome', 'Área', 'Meta', 'Último Resultado', 'Frequência', 'Ações'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 first:pl-6 last:pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indicadores.map((ind) => {
                const semaforo = calcSemaforo(ind.ultimo_resultado?.valor ?? null, ind.meta)
                const { label, cls, icon: Icon } = SEMAFORO_META[semaforo]
                return (
                  <tr key={ind.id} className={cn('border-b border-slate-50 hover:bg-slate-50/70 transition-colors', !ind.ativo && 'opacity-50')}>
                    <td className="px-4 py-3.5 pl-6">
                      <div className="flex items-center gap-2">
                        <SemaforoCircle s={semaforo} />
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1', cls)}>
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-slate-600">{ind.codigo ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/indicadores/${ind.id}`} className="font-semibold text-slate-900 hover:text-blue-700 transition-colors">
                        {ind.nome}
                      </Link>
                      {ind.descricao && (
                        <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">{ind.descricao}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {ind.areas?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold text-slate-900">
                        {ind.meta !== null ? `${ind.meta} ${ind.unidade_medida ?? ''}`.trim() : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {ind.ultimo_resultado ? (
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            {ind.ultimo_resultado.valor} {ind.unidade_medida ?? ''}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">({ind.ultimo_resultado.periodo})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sem lançamento</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {FREQ_LABEL[ind.frequencia ?? ''] ?? ind.frequencia ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 pr-6">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/indicadores/${ind.id}`}
                          className="px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Ver
                        </Link>
                        <ToggleButton id={ind.id} ativo={ind.ativo} />
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
