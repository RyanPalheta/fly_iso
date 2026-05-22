import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { listRegistroTipos } from '@/lib/queries/registro-tipos'
import { listAreasComUnidade } from '@/lib/queries/areas'
import { RegistroDynamicForm } from '@/components/registros/registro-dynamic-form'
import { TipoPicker } from '@/components/registros/tipo-picker'

export const metadata: Metadata = { title: 'Novo Registro | Fly ISO' }

interface Props {
  searchParams: Promise<{ tipo?: string }>
}

export default async function NovoRegistroPage({ searchParams }: Props) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const [tipos, areas] = await Promise.all([
    listRegistroTipos({ somenteAtivos: true }),
    listAreasComUnidade(),
  ])

  const tipoSelecionado = sp.tipo ? tipos.find((t) => t.id === sp.tipo) : null

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/registros" className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Registros
        </Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Novo Registro</span>
      </nav>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Novo Registro</h1>
        <p className="text-sm text-slate-500 mt-1">
          {tipoSelecionado
            ? `Tipo: ${tipoSelecionado.nome}`
            : 'Selecione o tipo de registro para começar'}
        </p>
      </div>

      {tipoSelecionado ? (
        <RegistroDynamicForm tipo={tipoSelecionado} areas={areas} />
      ) : (
        <TipoPicker tipos={tipos} />
      )}
    </div>
  )
}
