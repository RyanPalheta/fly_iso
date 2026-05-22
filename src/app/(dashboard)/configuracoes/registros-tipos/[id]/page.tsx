import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RegistroTipoForm } from '@/components/registros/registro-tipo-form'
import { getRegistroTipo } from '@/lib/queries/registro-tipos'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const t = await getRegistroTipo(id)
  return { title: t ? `${t.nome} | Tipos de Registro | Fly ISO` : 'Tipo de Registro | Fly ISO' }
}

export default async function EditarTipoRegistroPage({ params }: Props) {
  const { id } = await params
  const tipo = await getRegistroTipo(id)
  if (!tipo) notFound()

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/configuracoes/registros-tipos" className="hover:text-blue-700 transition-colors">Tipos de Registro</Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">{tipo.nome}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{tipo.nome}</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">{tipo.codigo}</p>
      </div>

      <RegistroTipoForm modo="edit" initial={tipo} />
    </div>
  )
}
