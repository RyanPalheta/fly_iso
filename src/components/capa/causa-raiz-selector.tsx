'use client'

import { useState, useTransition } from 'react'
import { GitBranch, Layers, FileText, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setCausaRaizMetodo } from '@/lib/actions/capa'
import { CincoPorquesEditor } from '@/components/capa/cinco-porques-editor'
import { IshikawaEditor } from '@/components/capa/ishikawa-editor'
import { TextoLivreEditor } from '@/components/capa/texto-livre-editor'

type Metodo = '5_porques' | 'ishikawa' | 'texto_livre'

interface CausaRaizSelectorProps {
  capaId:    string
  metodo:    string | null
  dados:     unknown
}

const METODOS: Array<{
  value: Metodo
  label: string
  desc:  string
  icon:  React.ElementType
  iconColor: string
  iconBg: string
}> = [
  {
    value: '5_porques',
    label: '5 Porquês',
    desc:  'Pergunta &ldquo;por quê?&rdquo; cinco vezes para chegar à causa raiz.',
    icon:  GitBranch,
    iconColor: 'text-blue-700',
    iconBg: 'bg-blue-50',
  },
  {
    value: 'ishikawa',
    label: 'Ishikawa (6M)',
    desc:  'Espinha de peixe: Método, Máquina, Mão de obra, Material, Medida, Meio ambiente.',
    icon:  Layers,
    iconColor: 'text-violet-700',
    iconBg: 'bg-violet-50',
  },
  {
    value: 'texto_livre',
    label: 'Texto Livre',
    desc:  'Descrição livre da investigação e causa identificada.',
    icon:  FileText,
    iconColor: 'text-emerald-700',
    iconBg: 'bg-emerald-50',
  },
]

interface PorqueItem { ordem: number; porque: string; resposta: string }

function parsePorques(dados: unknown): PorqueItem[] {
  if (!dados || typeof dados !== 'object') return []
  const d = dados as { porques?: unknown[] }
  if (!Array.isArray(d.porques)) return []
  return d.porques as PorqueItem[]
}

function parseIshikawa(dados: unknown) {
  if (!dados || typeof dados !== 'object') return undefined
  const d = dados as { categorias?: Record<string, unknown> }
  return d.categorias as {
    metodo:        string[]
    maquina:       string[]
    mao_de_obra:   string[]
    material:      string[]
    medida:        string[]
    meio_ambiente: string[]
  } | undefined
}

function parseTextoLivre(dados: unknown): string | undefined {
  if (!dados || typeof dados !== 'object') return undefined
  return (dados as { texto?: string }).texto
}

function hasData(metodo: Metodo, dados: unknown): boolean {
  if (metodo === '5_porques') {
    return parsePorques(dados).some((p) => p.resposta?.trim())
  }
  if (metodo === 'ishikawa') {
    const cats = parseIshikawa(dados) ?? {}
    return Object.values(cats).some((arr) => Array.isArray(arr) && arr.length > 0)
  }
  if (metodo === 'texto_livre') {
    return !!parseTextoLivre(dados)?.trim()
  }
  return false
}

export function CausaRaizSelector({ capaId, metodo, dados }: Readonly<CausaRaizSelectorProps>) {
  const currentMetodo = (metodo as Metodo | null) ?? '5_porques'
  const [selected, setSelected] = useState<Metodo>(currentMetodo)
  const [showWarning, setShowWarning] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSelect = (novo: Metodo) => {
    if (novo === selected) return

    // Se há dados no método atual, avisar antes de trocar
    if (hasData(selected, dados)) {
      setShowWarning(true)
      // Armazena o método pretendido — só troca após confirmar
      setSelected(novo)
      return
    }
    confirmSwitch(novo)
  }

  const confirmSwitch = (novo: Metodo) => {
    setShowWarning(false)
    startTransition(async () => {
      await setCausaRaizMetodo(capaId, novo)
    })
  }

  const cancelSwitch = () => {
    setSelected(currentMetodo)
    setShowWarning(false)
  }

  // Renderiza o editor correto
  const renderEditor = () => {
    if (currentMetodo === '5_porques') {
      return <CincoPorquesEditor capaId={capaId} initialData={parsePorques(dados)} />
    }
    if (currentMetodo === 'ishikawa') {
      return <IshikawaEditor capaId={capaId} initialData={parseIshikawa(dados)} />
    }
    if (currentMetodo === 'texto_livre') {
      return <TextoLivreEditor capaId={capaId} initialText={parseTextoLivre(dados)} />
    }
    return <CincoPorquesEditor capaId={capaId} initialData={parsePorques(dados)} />
  }

  return (
    <div className="space-y-5">
      {/* Seletor de método */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Método de Análise
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {METODOS.map((m) => {
            const Icon = m.icon
            const isActive = currentMetodo === m.value
            return (
              <button
                key={m.value}
                type="button"
                disabled={isPending}
                onClick={() => handleSelect(m.value)}
                className={cn(
                  'text-left p-4 rounded-xl ring-1 transition-all',
                  isActive
                    ? 'bg-white ring-blue-300 ring-2 shadow-sm'
                    : 'bg-slate-50 ring-slate-200 hover:bg-white hover:ring-slate-300'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', m.iconBg)}>
                    <Icon className={cn('h-4 w-4', m.iconColor)} />
                  </div>
                  {isActive && (
                    <span className="bg-blue-600 text-white text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Check className="h-2.5 w-2.5" />
                      Ativo
                    </span>
                  )}
                </div>
                <p className={cn('text-sm font-bold', isActive ? 'text-slate-900' : 'text-slate-700')}>
                  {m.label}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  {m.desc.replace('&ldquo;', '"').replace('&rdquo;', '"')}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Aviso de troca de método */}
      {showWarning && (
        <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900 mb-1">Trocar método de análise?</p>
              <p className="text-xs text-amber-800 mb-3">
                Os dados preenchidos no método atual serão <strong>descartados</strong> ao trocar.
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => confirmSwitch(selected)}
                  disabled={isPending}
                  className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg"
                >
                  Sim, trocar e descartar
                </button>
                <button
                  type="button"
                  onClick={cancelSwitch}
                  className="text-xs font-semibold text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor ativo */}
      {!showWarning && renderEditor()}
    </div>
  )
}
