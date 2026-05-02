'use client'

import { useRef, useTransition } from 'react'
import { createUnidade } from '@/lib/actions/configuracoes'
import { Plus, Loader2 } from 'lucide-react'

export function UnidadeForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const nome   = (fd.get('nome') as string).trim()
    const codigo = (fd.get('codigo') as string).trim()

    if (!nome) return

    startTransition(async () => {
      const result = await createUnidade({ nome, codigo: codigo || undefined })
      if (result.ok) {
        formRef.current?.reset()
      } else {
        alert(result.error ?? 'Erro ao criar unidade.')
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-wrap gap-2 items-end mt-4 pt-4 border-t border-slate-100"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="unidade-nome" className="text-xs font-medium text-slate-600">
          Nome da Unidade
        </label>
        <input
          id="unidade-nome"
          name="nome"
          required
          placeholder="Ex: Unidade São Paulo"
          className="h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="unidade-codigo" className="text-xs font-medium text-slate-600">
          Código (opcional)
        </label>
        <input
          id="unidade-codigo"
          name="codigo"
          placeholder="Ex: SP-01"
          className="h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-9 inline-flex items-center gap-1.5 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Adicionar Unidade
      </button>
    </form>
  )
}
