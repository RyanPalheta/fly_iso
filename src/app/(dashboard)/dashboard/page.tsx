import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FileText, AlertTriangle, ClipboardList,
  BarChart3, Clock, TrendingUp, CheckCircle2,
  AlertCircle, ShieldAlert,
} from 'lucide-react'
import { ACAO_META, ENTIDADE_LABEL } from '@/lib/queries/audit-log-types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityItem {
  id: string
  label: string
  acao: string
  entidade: string
  created_at: string
  actor: string | null
}

interface Alert {
  type: 'error' | 'warning'
  title: string
  description: string
  href: string
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getAllData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalDocs },
    { count: docsAprovados },
    { count: ncAbertas },
    { count: ncEncerradas },
    // NCs sem evolução há +15 dias (registrada OU em_analise e antigas)
    { count: ncVelhasRegistradas },
    { count: ncVelhasAnalise },
    { count: capasAbertas },
    // CAPAs em 'aberta' sem evolução há +30 dias
    { count: capasParadas },
    { count: indicadores },
    { count: totalTreinamentos },
    { count: treinamentosComCertificado },
    auditLogResult,
    ncFallbackResult,
    docsFallbackResult,
  ] = await Promise.all([
    supabase.from('documentos').select('*', { count: 'exact', head: true }),
    supabase.from('documentos').select('*', { count: 'exact', head: true }).eq('status', 'aprovado'),
    supabase.from('nao_conformidades').select('*', { count: 'exact', head: true }).neq('status', 'encerrada'),
    supabase.from('nao_conformidades').select('*', { count: 'exact', head: true }).eq('status', 'encerrada'),
    // NCs em 'registrada' há mais de 15 dias (sem análise iniciada)
    supabase.from('nao_conformidades').select('*', { count: 'exact', head: true })
      .eq('status', 'registrada')
      .lt('created_at', fifteenDaysAgo),
    // NCs em 'em_analise' há mais de 30 dias (sem CAPA aberta)
    supabase.from('nao_conformidades').select('*', { count: 'exact', head: true })
      .eq('status', 'em_analise')
      .lt('created_at', thirtyDaysAgo),
    supabase.from('capas').select('*', { count: 'exact', head: true }).neq('status', 'encerrada'),
    // CAPAs em 'aberta' há mais de 30 dias (sem investigação)
    supabase.from('capas').select('*', { count: 'exact', head: true })
      .eq('status', 'aberta')
      .lt('created_at', thirtyDaysAgo),
    supabase.from('indicadores').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('treinamentos').select('*', { count: 'exact', head: true }),
    supabase.from('treinamentos').select('*', { count: 'exact', head: true }).not('certificado_url', 'is', null),
    // Audit log — last 8 rows with actor join
    supabase.from('audit_log')
      .select('id, acao, entidade, entidade_id, created_at, usuarios!usuario_id(nome)')
      .order('created_at', { ascending: false })
      .limit(8),
    // Fallback: last 5 NCs
    supabase.from('nao_conformidades')
      .select('id, titulo, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    // Fallback: last 5 docs
    supabase.from('documentos')
      .select('id, titulo, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const auditRows = (auditLogResult.data ?? []) as any[]
  const ncFallback = (ncFallbackResult.data ?? []) as any[]
  const docsFallback = (docsFallbackResult.data ?? []) as any[]

  // Build activity items
  let activity: ActivityItem[] = []

  if (auditRows.length > 0) {
    activity = auditRows.map((row) => ({
      id: row.id,
      label: ENTIDADE_LABEL[row.entidade] ?? row.entidade,
      acao: row.acao,
      entidade: row.entidade,
      created_at: row.created_at,
      actor: row.usuarios?.nome ?? null,
    }))
  } else {
    // Merge NCs and docs as synthetic activity items
    const merged = [
      ...ncFallback.map((r: any) => ({
        id: r.id,
        label: r.titulo ?? 'Não Conformidade',
        acao: 'create',
        entidade: 'nao_conformidades',
        created_at: r.created_at,
        actor: null,
      })),
      ...docsFallback.map((r: any) => ({
        id: r.id,
        label: r.titulo ?? 'Documento',
        acao: 'create',
        entidade: 'documentos',
        created_at: r.created_at,
        actor: null,
      })),
    ]
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    activity = merged.slice(0, 8)
  }

  // Build alerts — ordered by severity
  const alerts: Alert[] = []

  const totalNcSemAcao = (ncVelhasRegistradas ?? 0) + (ncVelhasAnalise ?? 0)
  if ((ncVelhasRegistradas ?? 0) > 0) {
    const n = ncVelhasRegistradas ?? 0
    alerts.push({
      type: 'error',
      title: `${n} NC${n > 1 ? 's' : ''} sem análise há +15 dias`,
      description: `Ainda com status "Registrada" sem análise iniciada. Ação imediata necessária.`,
      href: '/nao-conformidades',
    })
  }
  if ((ncVelhasAnalise ?? 0) > 0) {
    const n = ncVelhasAnalise ?? 0
    alerts.push({
      type: 'warning',
      title: `${n} NC${n > 1 ? 's' : ''} em análise há +30 dias`,
      description: 'Em análise sem CAPA aberta há mais de 30 dias.',
      href: '/nao-conformidades',
    })
  }
  if ((capasParadas ?? 0) > 0) {
    const n = capasParadas ?? 0
    alerts.push({
      type: 'warning',
      title: `${n} CAPA${n > 1 ? 's' : ''} abertas sem investigação há +30 dias`,
      description: 'Aguardando início da investigação de causa raiz.',
      href: '/capa',
    })
  }
  void totalNcSemAcao // used above

  // Performance percentages
  const pctDocs = totalDocs && totalDocs > 0
    ? Math.round(((docsAprovados ?? 0) / totalDocs) * 100)
    : 0
  const totalNcs = (ncAbertas ?? 0) + (ncEncerradas ?? 0)
  const pctNcs = totalNcs > 0
    ? Math.round(((ncEncerradas ?? 0) / totalNcs) * 100)
    : 0
  const pctTreinamentos = (totalTreinamentos ?? 0) > 0
    ? Math.round(((treinamentosComCertificado ?? 0) / (totalTreinamentos ?? 1)) * 100)
    : null

  return {
    stats: {
      totalDocs: totalDocs ?? 0,
      docsAprovados: docsAprovados ?? 0,
      ncAbertas: ncAbertas ?? 0,
      ncEncerradas: ncEncerradas ?? 0,
      capasAbertas: capasAbertas ?? 0,
      indicadores: indicadores ?? 0,
    },
    activity,
    alerts,
    performance: { pctDocs, pctNcs, pctTreinamentos },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  return `${days}d atrás`
}

function entidadeInitials(entidade: string): string {
  const label = ENTIDADE_LABEL[entidade] ?? entidade
  const words = label.split(/\s+/)
  return words.length === 1
    ? words[0].substring(0, 2).toUpperCase()
    : (words[0][0] + words[1][0]).toUpperCase()
}

const ENTIDADE_COLOR: Record<string, string> = {
  documentos:        'bg-blue-100 text-blue-700',
  nao_conformidades: 'bg-red-100 text-red-700',
  capas:             'bg-amber-100 text-amber-700',
  acoes:             'bg-orange-100 text-orange-700',
  treinamentos:      'bg-green-100 text-green-700',
  indicadores:       'bg-purple-100 text-purple-700',
  registros:         'bg-slate-100 text-slate-600',
  reunioes:          'bg-cyan-100 text-cyan-700',
  usuarios:          'bg-indigo-100 text-indigo-700',
  importacoes:       'bg-rose-100 text-rose-700',
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = await createClient()
  const { stats, activity, alerts, performance } = await getAllData(supabase)

  const kpiCards = [
    {
      label: 'Documentos',
      value: stats.totalDocs,
      sub: `${stats.docsAprovados} aprovados`,
      icon: FileText,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      href: '/documentos',
    },
    {
      label: 'NCs Abertas',
      value: stats.ncAbertas,
      sub: `${stats.ncEncerradas} encerradas`,
      icon: AlertTriangle,
      iconColor: stats.ncAbertas > 0 ? 'text-red-600' : 'text-green-600',
      iconBg: stats.ncAbertas > 0 ? 'bg-red-100' : 'bg-green-100',
      href: '/nao-conformidades',
    },
    {
      label: 'CAPAs em Aberto',
      value: stats.capasAbertas,
      sub: 'ações corretivas/preventivas',
      icon: ClipboardList,
      iconColor: stats.capasAbertas > 0 ? 'text-amber-600' : 'text-green-600',
      iconBg: stats.capasAbertas > 0 ? 'bg-amber-100' : 'bg-green-100',
      href: '/capa',
    },
    {
      label: 'Indicadores Ativos',
      value: stats.indicadores,
      sub: 'monitorados',
      icon: BarChart3,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      href: '/indicadores',
    },
  ]

  const perfBars = [
    { label: 'Docs Aprovados', value: performance.pctDocs, color: 'bg-blue-500' },
    { label: 'NCs Encerradas', value: performance.pctNcs, color: 'bg-emerald-500' },
    ...(performance.pctTreinamentos !== null
      ? [{ label: 'Treinamentos c/ Certificado', value: performance.pctTreinamentos, color: 'bg-violet-500' }]
      : []),
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Visão geral da plataforma de gestão ISO 9001
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group relative bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 hover:shadow-md hover:ring-black/10 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="text-4xl font-extrabold text-slate-900 tabular-nums">{card.value}</p>
                <p className="text-xs text-slate-400">{card.sub}</p>
              </div>
              <div className={`flex items-center justify-center w-11 h-11 rounded-full ${card.iconBg} shrink-0`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Middle row: Activity + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* Atividade Recente — 60% */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-4 w-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-800">Atividade Recente</h2>
          </div>

          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-10 w-10 text-slate-200 mb-3" />
              <p className="text-sm text-slate-500">Nenhuma atividade registrada ainda.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {activity.map((item) => {
                const meta = ACAO_META[item.acao] ?? { label: item.acao, cls: 'bg-slate-100 text-slate-600' }
                const avatarCls = ENTIDADE_COLOR[item.entidade] ?? 'bg-slate-100 text-slate-600'
                return (
                  <li key={item.id} className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-bold shrink-0 ${avatarCls}`}
                      aria-hidden="true"
                    >
                      {entidadeInitials(item.entidade)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${meta.cls}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-sm text-slate-700 truncate">{item.label}</span>
                      </div>
                      {item.actor && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">por {item.actor}</p>
                      )}
                    </div>

                    {/* Time */}
                    <span className="text-xs text-slate-400 shrink-0">{relativeTime(item.created_at)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Alertas — 40% */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShieldAlert className="h-4 w-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-800">Alertas</h2>
          </div>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-3">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Tudo em ordem</p>
              <p className="text-xs text-slate-400 mt-1">Nenhum alerta ativo no momento.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {alerts.map((alert, i) => (
                <li key={i}>
                  <Link
                    href={alert.href}
                    className={`block rounded-xl p-4 hover:opacity-90 transition-opacity ${
                      alert.type === 'error'
                        ? 'bg-red-50 ring-1 ring-red-100'
                        : 'bg-amber-50 ring-1 ring-amber-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          alert.type === 'error' ? 'text-red-500' : 'text-amber-500'
                        }`}
                      />
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            alert.type === 'error' ? 'text-red-800' : 'text-amber-800'
                          }`}
                        >
                          {alert.title}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            alert.type === 'error' ? 'text-red-600' : 'text-amber-600'
                          }`}
                        >
                          {alert.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Performance dos Módulos */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-4 w-4 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-800">Conformidade do SGQ</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {perfBars.map((bar) => (
            <div key={bar.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-600">{bar.label}</span>
                <span className="text-sm font-semibold text-slate-800 tabular-nums">{bar.value}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${bar.color}`}
                  style={{ width: `${bar.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
