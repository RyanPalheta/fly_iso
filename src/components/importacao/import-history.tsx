import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportacaoRow {
  id: string
  arquivo_nome: string | null
  tipo_entidade: string | null
  status: string
  total_registros: number
  registros_importados: number
  registros_erro: number
  score_qualidade: number | null
  created_at: string
  importado_por_usuario?: { nome: string } | null
}

interface Props { importacoes: ImportacaoRow[] }

const STATUS_META = {
  pendente:    { label: 'Pendente',    cls: 'bg-slate-100 text-slate-600',   icon: Clock },
  processando: { label: 'Processando', cls: 'bg-amber-100 text-amber-700',  icon: AlertTriangle },
  concluida:   { label: 'Concluída',   cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  erro:        { label: 'Erro',        cls: 'bg-red-100 text-red-700',       icon: XCircle },
}

const ENTIDADE_LABEL: Record<string, string> = {
  nao_conformidades: 'Não Conformidades',
  documentos: 'Documentos', indicadores: 'Indicadores',
  treinamentos: 'Treinamentos', registros: 'Registros',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function ImportHistory({ importacoes }: Readonly<Props>) {
  if (importacoes.length === 0) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 text-center py-12">
      <p className="text-sm font-semibold text-slate-500">Nenhuma importação realizada</p>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">Histórico de Importações</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {['Status', 'Arquivo', 'Entidade', 'Total', 'Importados', 'Erros', 'Score', 'Usuário', 'Data'].map(h => (
              <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 first:pl-6 last:pr-6">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {importacoes.map(imp => {
            const meta = STATUS_META[imp.status as keyof typeof STATUS_META] ?? STATUS_META.pendente
            const Icon = meta.icon
            const score = imp.score_qualidade ?? 0
            const scoreCls = score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-red-600'

            return (
              <tr key={imp.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3.5 pl-6">
                  <span className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit', meta.cls)}>
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </td>
                <td className="px-4 py-3.5 max-w-[160px]">
                  <p className="text-xs font-semibold text-slate-700 truncate">{imp.arquivo_nome ?? '—'}</p>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-600">
                  {ENTIDADE_LABEL[imp.tipo_entidade ?? ''] ?? imp.tipo_entidade ?? '—'}
                </td>
                <td className="px-4 py-3.5 text-xs font-bold text-slate-700">{imp.total_registros}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-emerald-600">{imp.registros_importados}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-red-500">{imp.registros_erro}</td>
                <td className="px-4 py-3.5">
                  <span className={cn('text-xs font-extrabold', scoreCls)}>{score}%</span>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-500">
                  {(imp.importado_por_usuario as any)?.nome ?? '—'}
                </td>
                <td className="px-4 py-3.5 pr-6 text-xs text-slate-400 whitespace-nowrap">
                  {fmtDate(imp.created_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
