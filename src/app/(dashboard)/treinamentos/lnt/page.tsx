import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listLnt } from '@/lib/queries/treinamento-lnt'
import { listAreasComUnidade } from '@/lib/queries/areas'
import { LntPageClient } from '@/components/treinamentos/lnt-page-client'

export const metadata: Metadata = { title: 'LNT — Levantamento de Necessidades | Fly ISO' }

interface Props {
  searchParams: Promise<{ ano?: string; area?: string }>
}

export default async function LntPage({ searchParams }: Props) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const ano   = sp.ano  ? Number(sp.ano)  : new Date().getFullYear()
  const areaId = sp.area || undefined

  const [itens, areas] = await Promise.all([
    listLnt({ ano, areaId }),
    listAreasComUnidade(),
  ])

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/treinamentos" className="hover:text-blue-700 transition-colors">Treinamentos</Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">LNT</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Levantamento de Necessidades</h1>
          <p className="text-sm text-slate-500 mt-1">
            Identifique e priorize as necessidades de treinamento por área — ISO 9001 §7.2
          </p>
        </div>
        <Link
          href="/treinamentos/plano-anual"
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          Ver Plano Anual
        </Link>
      </div>

      <LntPageClient itens={itens} areas={areas} anoAtual={ano} areaFiltro={areaId ?? ''} />
    </div>
  )
}
