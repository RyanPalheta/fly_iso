import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, FileCheck, BookOpen, CheckCircle2, XCircle } from 'lucide-react'
import { listChecklists } from '@/lib/queries/auditorias'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Checklists | Auditorias | Fly ISO' }

export default async function ChecklistsPage() {
  const checklists = await listChecklists()

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/auditorias" className="hover:text-blue-700 transition-colors">Auditorias</Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Checklists</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Checklists de Auditoria</h1>
          <p className="text-sm text-slate-500 mt-1">
            Templates de perguntas reusáveis com pesos e opções de resposta configuráveis
          </p>
        </div>
        <Link href="/auditorias/checklists/novo"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold">
          <Plus className="h-4 w-4" /> Novo Checklist
        </Link>
      </div>

      {checklists.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-black/5 p-12 text-center">
          <FileCheck className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhum checklist cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checklists.map((c) => (
            <Link key={c.id} href={`/auditorias/checklists/${c.id}`}
              className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm hover:shadow-md hover:ring-blue-200 p-5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest">{c.codigo}</p>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{c.nome}</h3>
                  </div>
                </div>
                {c.ativo ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Ativo
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    <XCircle className="h-2.5 w-2.5" /> Inativo
                  </span>
                )}
              </div>
              {c.descricao && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.descricao}</p>
              )}
              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  <strong className="text-slate-700">{c.perguntas.length}</strong> perguntas
                </span>
                {c.tipo && (
                  <span className={cn('ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600')}>
                    {c.tipo}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
