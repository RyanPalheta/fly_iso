import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Activity } from 'lucide-react'
import { AuditLogTable } from '@/components/audit-log/audit-log-table'
import { listAuditLog, listUsuariosParaFiltro } from '@/lib/queries/audit-log'

export const metadata: Metadata = { title: 'Audit Log | Fly ISO' }

interface Props {
  searchParams: Promise<{
    entidade?: string
    acao?:     string
    usuario?:  string
    de?:       string
    ate?:      string
    offset?:   string
  }>
}

const LIMIT = 50

export default async function ConfigAuditLogPage({ searchParams }: Props) {
  const sp = await searchParams
  const offset = parseInt(sp.offset ?? '0', 10)

  const [{ rows, total }, usuarios] = await Promise.all([
    listAuditLog(
      {
        entidade:  sp.entidade,
        acao:      sp.acao,
        usuarioId: sp.usuario,
        de:        sp.de,
        ate:       sp.ate,
      },
      LIMIT,
      offset
    ),
    listUsuariosParaFiltro(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Audit Log Global</h1>
          <p className="text-sm text-slate-500 mt-0.5">Rastreabilidade completa de todas as ações do sistema</p>
        </div>
      </div>

      <Suspense fallback={<div className="h-96 bg-white rounded-2xl animate-pulse" />}>
        <AuditLogTable
          rows={rows}
          total={total}
          limit={LIMIT}
          offset={offset}
          usuarios={usuarios}
        />
      </Suspense>
    </div>
  )
}
