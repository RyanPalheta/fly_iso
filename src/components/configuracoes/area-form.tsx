'use client'

import { useRef, useTransition } from 'react'
import { createArea } from '@/lib/actions/configuracoes'
import { Plus, Loader2 } from 'lucide-react'

interface AreaFormProps {
  unidadeId: string
}

export function AreaForm({ unidadeId }: AreaFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd   = new FormData(e.currentTarget)
    const nome = (fd.get('nome') as string).trim()
    if (!nome) return

    startTransition(async () => {
      const result = await createArea({ nome, unidadeId })
      if (result.ok) {
        formRef.current?.reset()
      } else {
        alert(result.error ?? 'Erro ao criar área.')
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex gap-2 items-center mt-2"
    >
      <input
        name="nome"
        required
        placeholder="Nova área..."
        className="h-8 px-2.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0"
      />
      <button
        type="submit"
        disabled={isPending}
        className="h-8 inline-flex items-center gap-1 px-3 rounded-md bg-slate-800 text-white text-xs font-medium hover:bg-slate-900 disabled:opacity-60 transition-colors shrink-0"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
        Adicionar
      </button>
    </form>
  )
}
