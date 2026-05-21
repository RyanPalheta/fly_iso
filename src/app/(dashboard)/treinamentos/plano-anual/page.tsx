import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listLnt } from '@/lib/queries/treinamento-lnt'
import { listAreasComUnidade } from '@/lib/queries/areas'
import { PlanoAnualClient } from '@/components/treinamentos/plano-anual-client'

export const metadata: Metadata = { title: 'Plano Anual de Treinamentos | Fly ISO' }

interface Props {
  searchParams: Promise<{ ano?: string }>
}

export default async function PlanoAnualPage({ searchParams }: Props) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const ano = sp.ano ? Number(sp.ano) : new Date().getFullYear()

  const [itens, areas] = await Promise.all([
    listLnt({ ano }),
    listAreasComUnidade(),
  ])

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/treinamentos" className="hover:text-blue-700 transition-colors">Treinamentos</Link>
        <span>›</span>
        <Link href="/treinamentos/lnt" className="hover:text-blue-700 transition-colors">LNT</Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Plano Anual</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Plano Anual de Treinamentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visão consolidada das necessidades identificadas — ISO 9001 §7.2
          </p>
        </div>
        <Link
          href="/treinamentos/lnt"
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          Editar LNT
        </Link>
      </div>

      <PlanoAnualClient itens={itens} areas={areas} ano={ano} />
    </div>
  )
}
