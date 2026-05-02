'use client'

import { useTransition, useState } from 'react'
import { updatePerfilUsuario } from '@/lib/actions/configuracoes'
import { Loader2, Check } from 'lucide-react'

interface PerfilFormProps {
  defaultNome: string
}

export function PerfilForm({ defaultNome }: PerfilFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [nome, setNome] = useState(defaultNome)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = nome.trim()
    if (!trimmed) return
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updatePerfilUsuario({ nome: trimmed })
      if (result.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setError(result.error ?? 'Erro ao salvar.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div className="flex flex-col gap-1">
        <label htmlFor="perfil-nome" className="text-sm font-medium text-slate-700">
          Nome completo
        </label>
        <input
          id="perfil-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : null}
        {saved ? 'Salvo!' : 'Salvar alterações'}
      </button>
    </form>
  )
}
