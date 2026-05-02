import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { CapaKpiCards } from '@/components/capa/capa-kpi-cards'
import { CapaTable } from '@/components/capa/capa-table'
import { listCapas, getCapaStats } from '@/lib/queries/capas'

export const metadata: Metadata = { title: 'CAPA | Fly ISO' }

export default async function CapaPage() {
  const [capas, stats] = await Promise.all([listCapas(), getCapaStats()])

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <span>Padrão de Qualidade</span>
        <span>›</span>
        <span className="text-slate-900">CAPA</span>
      </nav>

      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Ações Corretivas e Preventivas
          </h1>
          <p className="text-slate-500 max-w-2xl text-sm">
            Gerencie o ciclo completo de CAPAs: análise de causa raiz com 5 Porquês,
            plano de ação e verificação de eficácia.
          </p>
        </div>
        <Link
          href="/capa/nova"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 transition-colors rounded-xl text-sm font-bold text-white shadow-md"
        >
          <Plus className="h-4 w-4" />
          Nova CAPA
        </Link>
      </div>

      <CapaKpiCards stats={stats} />
      <CapaTable capas={capas} />
    </div>
  )
}
