'use client'

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import type { NCParetoItem } from '@/lib/queries/nc'

interface Props { data: NCParetoItem[] }

export function NCPareto({ data }: Readonly<Props>) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 flex items-center justify-center h-72">
        <p className="text-sm text-slate-400 font-medium">Sem dados para o gráfico de Pareto</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Análise de Pareto — Origens das NCs</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Identifique as causas responsáveis por 80% das não conformidades
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-3 h-3 rounded bg-blue-600" /> Qtd. NCs
          </span>
          <span className="flex items-center gap-1.5 text-orange-500">
            <span className="w-6 h-0.5 bg-orange-500" /> % Acumulado
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 40, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="categoria"
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={45}
            />
            {/* Left axis — count */}
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            {/* Right axis — % */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}
              formatter={(value, name) =>
                name === 'total' ? [Number(value), 'Qtd. NCs'] : [`${value}%`, '% Acumulado']
              }
            />
            {/* 80% reference line */}
            <ReferenceLine
              yAxisId="right"
              y={80}
              stroke="#f97316"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{ value: '80%', fill: '#f97316', fontSize: 10, fontWeight: 700, position: 'insideTopRight' }}
            />
            <Bar yAxisId="left" dataKey="total" fill="#1d4ed8" radius={[6, 6, 0, 0]} maxBarSize={52} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="percentualAcumulado"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
        {data.slice(0, 4).map((item) => (
          <div key={item.categoria} className="text-center">
            <p className="text-xs font-semibold text-slate-500 truncate">{item.categoria}</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{item.total}</p>
            <p className="text-[10px] text-orange-500 font-bold">{item.percentualAcumulado}% acum.</p>
          </div>
        ))}
      </div>
    </div>
  )
}
