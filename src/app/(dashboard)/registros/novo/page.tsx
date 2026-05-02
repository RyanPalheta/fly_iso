'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

// This page needs to be a Client Component to access select lists
// For simplicity, we call the action directly from this page
import { createRegistro } from '@/lib/actions/registros'

export default function NovoRegistroPage() {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const res = await createRegistro({
        titulo:        fd.get('titulo') as string,
        tipo:          fd.get('tipo') as string,
        areaId:        '',
        responsavelId: '',
        dataCriacao:   fd.get('dataCriacao') as string,
      })
      if (!res.ok) { setError(res.error ?? 'Erro'); return }
      router.push('/registros')
    })
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'

  return (
    <div className="space-y-6 max-w-2xl">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/registros" className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Registros
        </Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Novo Registro</span>
      </nav>

      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Novo Registro</h1>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Título *</label>
          <input name="titulo" required placeholder="ex: Registro de Treinamento Q1-2026" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipo</label>
            <input name="tipo" placeholder="ex: Treinamento, Auditoria, Ata" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Data de Criação</label>
            <input name="dataCriacao" type="date" className={inputCls} defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors">
            Criar Registro
          </button>
        </div>
      </form>
    </div>
  )
}
