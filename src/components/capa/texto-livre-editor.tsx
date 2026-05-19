'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'
import { saveTextoLivre } from '@/lib/actions/capa'

interface TextoLivreEditorProps {
  capaId:      string
  initialText?: string
}

export function TextoLivreEditor({ capaId, initialText }: Readonly<TextoLivreEditorProps>) {
  const [texto, setTexto] = useState(initialText ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await saveTextoLivre({ capaId, texto })
      if (!result.ok) { setError(result.error ?? 'Erro ao salvar.'); return }
      setSaved(true)
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
          Descrição da Causa Raiz
        </label>
        <textarea
          rows={10}
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setSaved(false) }}
          placeholder="Descreva a investigação e a causa raiz identificada usando o método narrativo de sua escolha. Você pode usar análise FMEA, Árvore de Falhas, ou simplesmente descrever o raciocínio cronológico."
          className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-y leading-relaxed"
        />
        <p className="text-[10px] text-slate-400 mt-1">{texto.length} caracteres</p>
      </div>

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
          disabled={isPending || !texto.trim()}
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
