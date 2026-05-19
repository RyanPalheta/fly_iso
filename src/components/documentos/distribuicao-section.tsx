'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Send, Building2, MapPin, Plus, X, Loader2, Check, Mail, Package,
  Trash2, Calendar, User, FileText, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { distribuirDocumento, removerDistribuicao } from '@/lib/actions/distribuicao'
import type { DistribuicaoRow, DistribuicaoTipo } from '@/lib/queries/distribuicao'

interface UnidadeWithAreas {
  id:     string
  nome:   string
  codigo: string | null
  areas:  Array<{ id: string; nome: string }>
}

interface DistribuicaoSectionProps {
  documentoId:    string
  versaoAtualId:  string | null
  unidades:       UnidadeWithAreas[]
  distribuicoes:  DistribuicaoRow[]
  readOnly?:      boolean
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Agrupa distribuições por (tipo + unidade) para exibir como um único bloco
 * com todas as áreas listadas. Reduz ruído visual quando há muitas linhas.
 */
function groupDistribuicoes(rows: DistribuicaoRow[]) {
  const map = new Map<string, {
    tipo:      DistribuicaoTipo
    unidade:   { id: string; nome: string; codigo: string | null } | null
    items:     DistribuicaoRow[]
    areas:     string[]
  }>()
  for (const r of rows) {
    const key = `${r.tipo}-${r.unidade_id ?? 'sem'}`
    const cur = map.get(key)
    if (cur) {
      cur.items.push(r)
      if (r.area?.nome) cur.areas.push(r.area.nome)
    } else {
      map.set(key, {
        tipo: r.tipo,
        unidade: r.unidade,
        items: [r],
        areas: r.area?.nome ? [r.area.nome] : [],
      })
    }
  }
  return Array.from(map.values())
}

export function DistribuicaoSection({
  documentoId, versaoAtualId, unidades, distribuicoes, readOnly,
}: Readonly<DistribuicaoSectionProps>) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [tipo, setTipo] = useState<DistribuicaoTipo>('eletronica')
  const [selecoes, setSelecoes] = useState<Record<string, Set<string>>>({})
  // selecoes: unidadeId → Set<areaId>. Se Set vazio, distribui pra unidade inteira.
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<Set<string>>(new Set())
  const [numeroCopia, setNumeroCopia] = useState('')
  const [observacao, setObservacao] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const grupos = useMemo(() => groupDistribuicoes(distribuicoes), [distribuicoes])

  const toggleUnidade = (uid: string) => {
    setUnidadesSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) {
        next.delete(uid)
        // Remove áreas dessa unidade também
        setSelecoes((s) => {
          const cp = { ...s }
          delete cp[uid]
          return cp
        })
      } else {
        next.add(uid)
      }
      return next
    })
  }

  const toggleArea = (uid: string, areaId: string) => {
    setSelecoes((prev) => {
      const cur = new Set(prev[uid] ?? [])
      if (cur.has(areaId)) cur.delete(areaId)
      else cur.add(areaId)
      return { ...prev, [uid]: cur }
    })
  }

  const handleSubmit = () => {
    if (unidadesSelecionadas.size === 0) {
      setError('Selecione ao menos uma unidade.'); return
    }
    if (tipo === 'copia_controlada' && !numeroCopia.trim()) {
      setError('Informe o número da cópia controlada.'); return
    }
    setError(null)

    const unidadesPayload = Array.from(unidadesSelecionadas).map((uid) => ({
      unidadeId: uid,
      areaIds:   Array.from(selecoes[uid] ?? []),
    }))

    startTransition(async () => {
      const result = await distribuirDocumento({
        documentoId,
        versaoId:     versaoAtualId,
        tipo,
        unidades:     unidadesPayload,
        numeroCopia:  tipo === 'copia_controlada' ? numeroCopia : undefined,
        observacao:   observacao.trim() || undefined,
      })
      if (!result.ok) { setError(result.error ?? 'Erro ao distribuir.'); return }

      // Reset
      setShowForm(false)
      setUnidadesSelecionadas(new Set())
      setSelecoes({})
      setNumeroCopia('')
      setObservacao('')
      router.refresh()
    })
  }

  const handleRemove = (distribuicaoId: string) => {
    if (!confirm('Remover esta distribuição? Esta ação não pode ser desfeita.')) return
    startTransition(async () => {
      const result = await removerDistribuicao({ distribuicaoId, documentoId })
      if (!result.ok) { alert(result.error ?? 'Erro ao remover.'); return }
      router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Send className="h-4 w-4 text-slate-400" />
            Distribuição
            {distribuicoes.length > 0 && (
              <span className="text-[10px] font-bold text-slate-400">
                ({distribuicoes.length} {distribuicoes.length === 1 ? 'registro' : 'registros'})
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle quem tem acesso ao documento — eletrônico ou cópia física.
          </p>
        </div>
        {!readOnly && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Distribuir
          </button>
        )}
      </div>

      {/* Lista de distribuições */}
      {grupos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Send className="h-10 w-10 text-slate-200 mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhuma distribuição ainda</p>
          <p className="text-xs text-slate-400 mt-1">
            Distribua o documento para liberar acesso às unidades/áreas.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {grupos.map((g) => (
            <li
              key={`${g.tipo}-${g.unidade?.id ?? 'sem'}`}
              className={cn(
                'rounded-xl p-4 ring-1',
                g.tipo === 'copia_controlada'
                  ? 'bg-amber-50/50 ring-amber-100'
                  : 'bg-slate-50 ring-slate-100'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    g.tipo === 'copia_controlada'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  )}>
                    {g.tipo === 'copia_controlada' ? <Package className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider',
                        g.tipo === 'copia_controlada'
                          ? 'bg-amber-200/60 text-amber-800'
                          : 'bg-blue-200/60 text-blue-800'
                      )}>
                        {g.tipo === 'copia_controlada' ? 'Cópia Controlada' : 'Eletrônica'}
                      </span>
                      <span className="text-sm font-bold text-slate-900 truncate flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        {g.unidade?.nome ?? '—'}
                      </span>
                    </div>

                    {g.areas.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {g.areas.map((a, i) => (
                          <span key={a + i} className="bg-white text-slate-600 text-[10px] font-semibold rounded-full px-2 py-0.5 ring-1 ring-slate-200">
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic mt-1">Unidade inteira</p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {fmt(g.items[0].data_distribuicao)}
                      </span>
                      {g.items[0].distribuidor && (
                        <span className="flex items-center gap-1">
                          <User className="h-2.5 w-2.5" />
                          {g.items[0].distribuidor.nome}
                        </span>
                      )}
                      {g.items[0].numero_copia && (
                        <span className="flex items-center gap-1 font-mono font-bold text-amber-700">
                          #{g.items[0].numero_copia}
                        </span>
                      )}
                    </div>

                    {g.items[0].observacao && (
                      <p className="text-[11px] text-slate-600 mt-2 italic">
                        &ldquo;{g.items[0].observacao}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex flex-col gap-1 shrink-0">
                    {g.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        disabled={isPending}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
                        title={`Remover ${item.area?.nome ?? 'esta distribuição'}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Form de nova distribuição */}
      {showForm && (
        <div className="mt-5 pt-5 border-t border-slate-100 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Tipo de Distribuição
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('eletronica')}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl text-left transition-all',
                  tipo === 'eletronica'
                    ? 'bg-blue-50 ring-2 ring-blue-300'
                    : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                )}
              >
                <Mail className={cn('h-4 w-4', tipo === 'eletronica' ? 'text-blue-700' : 'text-slate-400')} />
                <div className="min-w-0">
                  <p className={cn('text-xs font-bold', tipo === 'eletronica' ? 'text-blue-800' : 'text-slate-700')}>
                    Eletrônica
                  </p>
                  <p className="text-[10px] text-slate-500">Acesso via sistema</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipo('copia_controlada')}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl text-left transition-all',
                  tipo === 'copia_controlada'
                    ? 'bg-amber-50 ring-2 ring-amber-300'
                    : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                )}
              >
                <Package className={cn('h-4 w-4', tipo === 'copia_controlada' ? 'text-amber-700' : 'text-slate-400')} />
                <div className="min-w-0">
                  <p className={cn('text-xs font-bold', tipo === 'copia_controlada' ? 'text-amber-800' : 'text-slate-700')}>
                    Cópia Controlada
                  </p>
                  <p className="text-[10px] text-slate-500">Registro físico</p>
                </div>
              </button>
            </div>
          </div>

          {/* Número da cópia (só para controlada) */}
          {tipo === 'copia_controlada' && (
            <div>
              <label htmlFor="numeroCopia" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Número da Cópia <span className="text-red-500">*</span>
              </label>
              <input
                id="numeroCopia"
                type="text"
                value={numeroCopia}
                onChange={(e) => setNumeroCopia(e.target.value)}
                placeholder="Ex: COPIA-001/2026"
                className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none font-mono"
              />
            </div>
          )}

          {/* Unidades + Áreas */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Unidades e Áreas
            </label>
            {unidades.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Nenhuma unidade cadastrada. Cadastre em Configurações → Organização.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {unidades.map((u) => {
                  const selected = unidadesSelecionadas.has(u.id)
                  const areasSelecionadas = selecoes[u.id] ?? new Set<string>()
                  return (
                    <div
                      key={u.id}
                      className={cn(
                        'rounded-xl ring-1 transition-colors',
                        selected ? 'bg-blue-50/50 ring-blue-200' : 'bg-slate-50/50 ring-slate-200'
                      )}
                    >
                      {/* Header da unidade */}
                      <button
                        type="button"
                        onClick={() => toggleUnidade(u.id)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                          selected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                        )}>
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <Building2 className={cn('h-3.5 w-3.5', selected ? 'text-blue-700' : 'text-slate-400')} />
                        <span className={cn(
                          'text-sm flex-1',
                          selected ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                        )}>
                          {u.nome}
                        </span>
                        {selected && areasSelecionadas.size === 0 && (
                          <span className="text-[10px] font-bold text-blue-600">unidade inteira</span>
                        )}
                        {selected && areasSelecionadas.size > 0 && (
                          <span className="text-[10px] font-bold text-blue-600">
                            {areasSelecionadas.size}/{u.areas.length} áreas
                          </span>
                        )}
                      </button>

                      {/* Áreas (só se unidade selecionada) */}
                      {selected && u.areas.length > 0 && (
                        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                          {u.areas.map((a) => {
                            const aSelected = areasSelecionadas.has(a.id)
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => toggleArea(u.id, a.id)}
                                className={cn(
                                  'flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-1 transition-colors',
                                  aSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-blue-300'
                                )}
                              >
                                <MapPin className="h-2.5 w-2.5" />
                                {a.nome}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5">
              Selecione a unidade. Se não escolher nenhuma área, libera para a unidade inteira.
            </p>
          </div>

          {/* Observação */}
          <div>
            <label htmlFor="observacao" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Observação <span className="text-slate-300 normal-case font-medium">(opcional)</span>
            </label>
            <textarea
              id="observacao"
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Distribuído após reunião de aprovação de 18/05."
              className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none"
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 ring-1 ring-red-100 rounded-lg px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setUnidadesSelecionadas(new Set())
                setSelecoes({})
                setNumeroCopia('')
                setObservacao('')
                setError(null)
              }}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Confirmar Distribuição
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
