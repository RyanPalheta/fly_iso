import type { Metadata } from 'next'
import { Building2, Users2, FileText, AlertTriangle, ClipboardList, CheckCircle, XCircle } from 'lucide-react'
import { listUnidadesComAreas, getOrganizacaoStats } from '@/lib/queries/configuracoes'
import { UnidadeForm } from '@/components/configuracoes/unidade-form'
import { AreaForm } from '@/components/configuracoes/area-form'

export const metadata: Metadata = { title: 'Organização | Fly ISO' }

export default async function OrganizacaoPage() {
  const [unidades, stats] = await Promise.all([
    listUnidadesComAreas(),
    getOrganizacaoStats(),
  ])

  const statCards = [
    { label: 'Total de Usuários',  value: stats.totalUsuarios,   icon: Users2,        bg: 'bg-blue-50',    ib: 'bg-blue-100',    ic: 'text-blue-700'    },
    { label: 'Documentos',         value: stats.totalDocumentos,  icon: FileText,       bg: 'bg-violet-50',  ib: 'bg-violet-100',  ic: 'text-violet-700'  },
    { label: 'Não Conformidades',  value: stats.totalNCs,         icon: AlertTriangle,  bg: 'bg-amber-50',   ib: 'bg-amber-100',   ic: 'text-amber-700'   },
    { label: 'CAPAs',              value: stats.totalCAPAs,       icon: ClipboardList,  bg: 'bg-emerald-50', ib: 'bg-emerald-100', ic: 'text-emerald-700' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Organização</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie unidades, áreas e veja estatísticas gerais</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, bg, ib, ic }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 ring-1 ring-black/5`}>
            <div className={`w-9 h-9 rounded-xl ${ib} flex items-center justify-center mb-3`}>
              <Icon className={`h-4 w-4 ${ic}`} />
            </div>
            <div className={`text-2xl font-extrabold ${ic}`}>{value}</div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Unidades */}
      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Unidades</h2>
          <span className="text-xs text-slate-400">{unidades.length} unidade(s)</span>
        </div>

        {unidades.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Nenhuma unidade cadastrada ainda.</p>
        ) : (
          <div className="space-y-4">
            {unidades.map((unidade) => (
              <div key={unidade.id} className="border border-slate-100 rounded-xl p-4">
                {/* Unidade header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{unidade.nome}</span>
                      {unidade.codigo && (
                        <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          {unidade.codigo}
                        </span>
                      )}
                      {unidade.ativa ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" /> Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3" /> Inativa
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Areas */}
                {unidade.areas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {unidade.areas.map((area) => (
                      <span
                        key={area.id}
                        className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium"
                      >
                        {area.nome}
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Area form */}
                <AreaForm unidadeId={unidade.id} />
              </div>
            ))}
          </div>
        )}

        {/* Add Unidade form */}
        <UnidadeForm />
      </div>
    </div>
  )
}
