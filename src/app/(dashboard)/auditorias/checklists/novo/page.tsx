import type { Metadata } from 'next'
import Link from 'next/link'
import { ChecklistForm } from '@/components/auditorias/checklist-form'

export const metadata: Metadata = { title: 'Novo Checklist | Fly ISO' }

export default function NovoChecklistPage() {
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/auditorias" className="hover:text-blue-700 transition-colors">Auditorias</Link>
        <span>›</span>
        <Link href="/auditorias/checklists" className="hover:text-blue-700 transition-colors">Checklists</Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Novo</span>
      </nav>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Novo Checklist</h1>
        <p className="text-sm text-slate-500 mt-1">Configure perguntas com cláusula, peso e opções de resposta</p>
      </div>
      <ChecklistForm modo="create" />
    </div>
  )
}
