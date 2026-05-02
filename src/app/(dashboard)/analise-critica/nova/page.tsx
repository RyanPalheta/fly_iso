'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar } from 'lucide-react'
import { createReuniao } from '@/lib/actions/reunioes'

export default function NovaReuniaoPage() {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const titulo = fd.get('titulo') as string
    const data   = fd.get('data') as string
    if (!titulo || !data) { setError('Preencha todos os campos obrigatórios.'); return }

    setError(null)
    startTransition(async () => {
      const res = await createReuniao({ titulo, data })
      if (!res.ok) { setError(res.error ?? 'Erro'); return }
      router.push(`/analise-critica/${res.id}`)
    })
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'

  return (
    <div className="space-y-6 max-w-2xl">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/analise-critica" className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Análise Crítica
        </Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Nova Reunião</span>
      </nav>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nova Reunião de Análise Crítica</h1>
        <p className="text-sm text-slate-500 mt-1">
          Os 12 inputs da ISO 9001:2015 cláusula 9.3 serão criados automaticamente.
        </p>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Título da Reunião *</label>
          <input
            name="titulo"
            required
            placeholder="ex: Análise Crítica da Direção — 1º Semestre 2026"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Data *</label>
          <div className="relative">
            <input name="data" type="date" required className={inputCls} defaultValue={new Date().toISOString().split('T')[0]} />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="px-4 py-3 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-200">
          <p className="font-bold mb-1">12 inputs ISO 9001:2015 serão criados automaticamente:</p>
          <p className="text-blue-600">Resultados de auditorias · Mudanças externas/internas · NCs e ações corretivas · Satisfação de clientes · Desempenho de fornecedores · Recursos · Riscos e oportunidades · KPIs · e mais...</p>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors">
            Criar Reunião
          </button>
        </div>
      </form>
    </div>
  )
}
