'use client'

import { useState, useTransition } from 'react'
import { ChevronRight, Save, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveCincoPortques } from '@/lib/actions/capa'

interface Porque {
  ordem: number
  porque: string
  resposta: string
}

interface CincoPorquesEditorProps {
  capaId: string
  initialData?: Porque[]
}

const PROMPTS = [
  'Por que a não conformidade ocorreu?',
  'Por que isso aconteceu?',
  'Por que essa causa existe?',
  'Por que essa condição não foi detectada antes?',
  'Por que o sistema permitiu que chegasse até aqui?',
]

export function CincoPorquesEditor({ capaId, initialData }: Readonly<CincoPorquesEditorProps>) {
  const [porques, setPorques] = useState<Porque[]>(
    initialData?.length
      ? initialData
      : PROMPTS.map((_, i) => ({ ordem: i + 1, porque: PROMPTS[i], resposta: '' }))
  )
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const setResposta = (ordem: number, resposta: string) => {
    setSaved(false)
    setPorques((prev) => prev.map((p) => (p.ordem === ordem ? { ...p, resposta } : p)))
  }

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await saveCincoPortques({ capaId, porques })
      if (!result.ok) { setError(result.error ?? 'Erro ao salvar.'); return }
      setSaved(true)
    })
  }

  // Determina até qual nível o usuário pode editar (cada resposta desbloqueia o próximo)
  const activeUntil = porques.findIndex((p) => !p.resposta.trim())
  const maxActive = activeUntil === -1 ? 5 : activeUntil

  return (
    <div className="space-y-4">
      {porques.map((p, idx) => {
        const isLocked = idx > maxActive
        const isDone   = p.resposta.trim().length > 0

        return (
          <div
            key={p.ordem}
            className={cn(
              'rounded-xl border transition-all',
              isLocked
                ? 'border-slate-100 bg-slate-50/50 opacity-50'
                : isDone
                ? 'border-emerald-200 bg-emerald-50/30'
                : 'border-blue-200 bg-white shadow-sm'
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0',
                isLocked  ? 'bg-slate-200 text-slate-400'
                : isDone  ? 'bg-emerald-500 text-white'
                : 'bg-blue-700 text-white'
              )}>
                {isDone && !isLocked ? <CheckCircle2 className="h-4 w-4" /> : p.ordem}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                  {p.ordem}º Porquê
                </p>
                <p className="text-sm font-semibold text-slate-700">{p.porque}</p>
              </div>
              {idx < porques.length - 1 && isDone && (
                <ChevronRight className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
            </div>

            {/* Answer */}
            {!isLocked && (
              <div className="px-5 pb-5">
                <textarea
                  rows={3}
                  disabled={isLocked}
                  placeholder={`Responda ao ${p.ordem}º porquê…`}
                  value={p.resposta}
                  onChange={(e) => setResposta(p.ordem, e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none disabled:opacity-50"
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Causa raiz derivada */}
      {porques[4].resposta.trim() && (
        <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1">
            Causa Raiz Identificada
          </p>
          <p className="text-sm font-semibold leading-relaxed">{porques[4].resposta}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Salvo com sucesso</p>}
        {!error && !saved && <span />}
        <button
          type="button"
          disabled={isPending || porques.every((p) => !p.resposta.trim())}
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Análise
        </button>
      </div>
    </div>
  )
}
