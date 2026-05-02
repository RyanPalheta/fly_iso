import type { Metadata } from 'next'
import { IndicadorKpiCards } from '@/components/indicadores/indicador-kpi-cards'
import { IndicadorTable } from '@/components/indicadores/indicador-table'
import { listIndicadores, getIndicadorStats } from '@/lib/queries/indicadores'

export const metadata: Metadata = { title: 'Indicadores | Fly ISO' }

export default async function IndicadoresPage() {
  const [indicadores, stats] = await Promise.all([
    listIndicadores(),
    getIndicadorStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Indicadores de Desempenho</h1>
        <p className="text-sm text-slate-500 mt-1">Monitore os KPIs e metas da sua organização ISO 9001</p>
      </div>

      <IndicadorKpiCards stats={stats} />
      <IndicadorTable indicadores={indicadores} />
    </div>
  )
}
