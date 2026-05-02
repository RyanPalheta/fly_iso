'use client'

import { AlertTriangle, Settings2, CheckCircle2, TrendingUp, Plus, ShieldCheck } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts'
import { mockNCDashboard } from '@/data/mockData'
import { cn } from '@/lib/utils'

const d = mockNCDashboard

export function NCDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Visão Geral da Qualidade
        </h1>
        <p className="text-slate-500 text-sm max-w-xl">
          Monitore e analise as Não Conformidades em toda a organização. O rastreamento
          proativo garante conformidade e melhoria contínua.
        </p>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <TopKpi
          icon={AlertTriangle}
          iconBg="bg-red-100 text-red-600"
          label="NCs Abertas"
          value={d.ncsAbertas}
          delta={d.deltaAbertas}
          deltaColor="text-red-500"
        />
        <TopKpi
          icon={Settings2}
          iconBg="bg-blue-100 text-blue-600"
          label="Em Tratamento"
          value={d.ncsEmTratamento}
          deltaLabel="Ativo Agora"
          deltaColor="text-slate-400"
        />
        <TopKpi
          icon={CheckCircle2}
          iconBg="bg-emerald-100 text-emerald-600"
          label="Fechadas este Mês"
          value={d.ncsFechadasMes}
          delta={d.deltaFechadas}
          deltaColor="text-emerald-500"
        />
      </div>

      {/* Middle row: Origin + Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="NCs por Origem">
          <div className="space-y-4 mt-4">
            {d.origens.map((o) => (
              <div key={o.label}>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">{o.label.toUpperCase()}</span>
                  <span className="text-slate-900">{o.percent}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', o.color)}
                    style={{ width: `${o.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="NCs por Área">
          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.areas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                />
                <Bar dataKey="valor" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Trend + Resolution time */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card
          title="Tendência Mensal"
          rightLabel={
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-700" /> NCs Criadas
            </span>
          }
          className="lg:col-span-2"
        >
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.tendencia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="ncs"
                  stroke="#1d4ed8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1d4ed8', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Média de Resolução">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="3"
                  strokeDasharray="70, 100"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-slate-900">{d.mediaResolucaoDias}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DIAS</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              Meta: 7 Dias
            </p>
          </div>
        </Card>
      </div>

      {/* Bottom row: pending actions + conformance score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-900">Ações Pendentes</h2>
            <button className="text-xs font-bold text-blue-700 hover:underline">Ver Todas →</button>
          </div>
          <div className="space-y-3">
            {d.acoesPendentes.map((a) => (
              <div
                key={a.codigo}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border-l-4 border-red-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{a.titulo}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{a.codigo}</p>
                </div>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide',
                    a.prioridade === 'alta'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-sky-100 text-sky-700'
                  )}
                >
                  {a.prioridade === 'alta' ? 'Prioridade alta' : 'Recente'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
          <ShieldCheck className="absolute -right-6 -bottom-6 h-36 w-36 opacity-10" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1">
            Score de Conformidade
          </h3>
          <p className="text-xs text-blue-100/80 leading-relaxed max-w-[80%]">
            Sua organização está atendendo atualmente a <span className="font-bold text-white">94%</span>{' '}
            dos requisitos da ISO 9001.
          </p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-6xl font-extrabold tracking-tighter">{d.scoreConformidade}</span>
            <span className="text-2xl font-bold">%</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mt-1">
            Excelente Status
          </p>
        </div>
      </div>

      {/* Floating CTA */}
      <button
        className="fixed bottom-8 right-8 px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-lg flex items-center gap-2 transition-all active:scale-95 z-30 font-bold text-sm"
      >
        <Plus className="h-5 w-5" />
        Nova Entrada
      </button>
    </div>
  )
}

// ── Small helpers ──

function TopKpi({
  icon: Icon, iconBg, label, value, delta, deltaLabel, deltaColor,
}: Readonly<{
  icon: React.ElementType
  iconBg: string
  label: string
  value: number
  delta?: string
  deltaLabel?: string
  deltaColor: string
}>) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 flex items-center gap-4">
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', iconBg)}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-4xl font-extrabold text-slate-900">{value}</span>
          {delta && <span className={cn('text-xs font-bold', deltaColor)}>{delta}</span>}
          {deltaLabel && <span className={cn('text-[10px] font-semibold', deltaColor)}>{deltaLabel}</span>}
        </div>
      </div>
    </div>
  )
}

function Card({
  title, children, className, rightLabel,
}: Readonly<{
  title: string
  children: React.ReactNode
  className?: string
  rightLabel?: React.ReactNode
}>) {
  return (
    <div className={cn('bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {rightLabel}
      </div>
      {children}
    </div>
  )
}
