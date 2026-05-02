import type { Metadata } from 'next'
import { TreinamentoKpiCards } from '@/components/treinamentos/treinamento-kpi-cards'
import { TreinamentoTable } from '@/components/treinamentos/treinamento-table'
import { listTreinamentos, getTreinamentoStats } from '@/lib/queries/treinamentos'

export const metadata: Metadata = { title: 'Treinamentos | Fly ISO' }

export default async function TreinamentosPage() {
  const [treinamentos, stats] = await Promise.all([
    listTreinamentos(),
    getTreinamentoStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Treinamentos</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie a capacitação e conformidade da equipe</p>
      </div>
      <TreinamentoKpiCards stats={stats} />
      <TreinamentoTable treinamentos={treinamentos} />
    </div>
  )
}
