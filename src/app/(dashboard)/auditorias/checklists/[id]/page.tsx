import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChecklistForm } from '@/components/auditorias/checklist-form'
import { getChecklist } from '@/lib/queries/auditorias'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const c = await getChecklist(id)
  return { title: c ? `${c.nome} | Checklist | Fly ISO` : 'Checklist | Fly ISO' }
}

export default async function EditarChecklistPage({ params }: Props) {
  const { id } = await params
  const c = await getChecklist(id)
  if (!c) notFound()

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/auditorias" className="hover:text-blue-700 transition-colors">Auditorias</Link>
        <span>›</span>
        <Link href="/auditorias/checklists" className="hover:text-blue-700 transition-colors">Checklists</Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">{c.nome}</span>
      </nav>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{c.nome}</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">{c.codigo}</p>
      </div>
      <ChecklistForm modo="edit" initial={c} />
    </div>
  )
}
