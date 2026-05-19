'use client'

import { useState, useTransition } from 'react'
import {
  Plus, X, Save, Loader2, CheckCircle2,
  Settings, Wrench, Users, Package, Ruler, Wind,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveIshikawa } from '@/lib/actions/capa'

type CategoriaKey = 'metodo' | 'maquina' | 'mao_de_obra' | 'material' | 'medida' | 'meio_ambiente'

interface CategoriaConfig {
  key:   CategoriaKey
  label: string
  desc:  string
  icon:  React.ElementType
  color: string
  ring:  string
}

const CATEGORIAS: CategoriaConfig[] = [
  { key: 'metodo',        label: 'Método',        desc: 'Procedimentos, instruções',     icon: Settings, color: 'text-blue-700',    ring: 'ring-blue-200' },
  { key: 'maquina',       label: 'Máquina',       desc: 'Equipamentos, ferramentas',     icon: Wrench,   color: 'text-violet-700',  ring: 'ring-violet-200' },
  { key: 'mao_de_obra',   label: 'Mão de Obra',   desc: 'Pessoas, treinamento',          icon: Users,    color: 'text-emerald-700', ring: 'ring-emerald-200' },
  { key: 'material',      label: 'Material',      desc: 'Insumos, matérias-primas',      icon: Package,  color: 'text-amber-700',   ring: 'ring-amber-200' },
  { key: 'medida',        label: 'Medida',        desc: 'Indicadores, calibração',       icon: Ruler,    color: 'text-rose-700',    ring: 'ring-rose-200' },
  { key: 'meio_ambiente', label: 'Meio Ambiente', desc: 'Temperatura, ruído, layout',    icon: Wind,     color: 'text-cyan-700',    ring: 'ring-cyan-200' },
]

interface IshikawaEditorProps {
  capaId:       string
  initialData?: Partial<Record<CategoriaKey, string[]>>
}

export function IshikawaEditor({ capaId, initialData }: Readonly<IshikawaEditorProps>) {
  const [categorias, setCategorias] = useState<Record<CategoriaKey, string[]>>({
    metodo:        initialData?.metodo        ?? [],
    maquina:       initialData?.maquina       ?? [],
    mao_de_obra:   initialData?.mao_de_obra   ?? [],
    material:      initialData?.material      ?? [],
    medida:        initialData?.medida        ?? [],
    meio_ambiente: initialData?.meio_ambiente ?? [],
  })
  const [activeInput, setActiveInput] = useState<Record<CategoriaKey, string>>({
    metodo: '', maquina: '', mao_de_obra: '',
    material: '', medida: '', meio_ambiente: '',
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const addCausa = (key: CategoriaKey) => {
    const text = activeInput[key].trim()
    if (!text) return
    setSaved(false)
    setCategorias((prev) => ({ ...prev, [key]: [...prev[key], text] }))
    setActiveInput((prev) => ({ ...prev, [key]: '' }))
  }

  const removeCausa = (key: CategoriaKey, idx: number) => {
    setSaved(false)
    setCategorias((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx),
    }))
  }

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await saveIshikawa({ capaId, categorias })
      if (!result.ok) { setError(result.error ?? 'Erro ao salvar.'); return }
      setSaved(true)
    })
  }

  const totalCausas = Object.values(categorias).reduce((s, arr) => s + arr.length, 0)
  const categoriasPreenchidas = Object.values(categorias).filter((arr) => arr.length > 0).length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
        <div className="flex items-center gap-6 text-xs">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categorias</p>
            <p className="text-lg font-extrabold text-slate-900">{categoriasPreenchidas}/6</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Causas Identificadas</p>
            <p className="text-lg font-extrabold text-slate-900">{totalCausas}</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 max-w-xs text-right">
          Liste possíveis causas em cada categoria dos <strong>6Ms</strong> (Método, Máquina, Mão de Obra,
          Material, Medida, Meio Ambiente).
        </p>
      </div>

      {/* Grid das 6 categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {CATEGORIAS.map((cat) => {
          const Icon = cat.icon
          const causas = categorias[cat.key]
          return (
            <div
              key={cat.key}
              className={cn(
                'bg-white rounded-xl p-4 ring-1 transition-colors',
                causas.length > 0 ? cat.ring : 'ring-slate-100'
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className={cn('w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center', cat.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-bold', cat.color)}>{cat.label}</p>
                  <p className="text-[10px] text-slate-400">{cat.desc}</p>
                </div>
                {causas.length > 0 && (
                  <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    {causas.length}
                  </span>
                )}
              </div>

              {/* Lista de causas */}
              {causas.length > 0 && (
                <ul className="space-y-1.5 mb-3">
                  {causas.map((c, i) => (
                    <li
                      key={c + i}
                      className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 rounded-lg px-2.5 py-1.5"
                    >
                      <span className="text-slate-400 shrink-0">•</span>
                      <span className="flex-1 break-words">{c}</span>
                      <button
                        type="button"
                        onClick={() => removeCausa(cat.key, i)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-0.5 shrink-0"
                        aria-label="Remover"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Input para adicionar */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={activeInput[cat.key]}
                  onChange={(e) => setActiveInput((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCausa(cat.key) } }}
                  placeholder={`Adicionar causa em ${cat.label.toLowerCase()}...`}
                  className="flex-1 px-3 py-1.5 bg-slate-50 rounded-lg text-xs border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => addCausa(cat.key)}
                  disabled={!activeInput[cat.key].trim()}
                  className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white transition-colors"
                  aria-label="Adicionar"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pt-2">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && (
          <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Salvo com sucesso
          </p>
        )}
        {!error && !saved && <span />}
        <button
          type="button"
          disabled={isPending || totalCausas === 0}
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Diagrama
        </button>
      </div>
    </div>
  )
}
