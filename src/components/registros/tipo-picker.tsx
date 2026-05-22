import Link from 'next/link'
import { FileBox, ChevronRight, Settings } from 'lucide-react'
import type { RegistroTipoRow } from '@/lib/queries/registro-tipos'

interface Props { tipos: RegistroTipoRow[] }

export function TipoPicker({ tipos }: Readonly<Props>) {
  if (tipos.length === 0) {
    return (
      <div className="bg-white rounded-2xl ring-1 ring-black/5 p-12 text-center">
        <FileBox className="h-10 w-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500">Nenhum tipo de registro disponível.</p>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Crie um tipo de registro primeiro em Configurações.
        </p>
        <Link
          href="/configuracoes/registros-tipos/novo"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          <Settings className="h-4 w-4" /> Criar Tipo de Registro
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tipos.map((t) => (
        <Link
          key={t.id}
          href={`/registros/novo?tipo=${t.id}`}
          className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm hover:shadow-md hover:ring-blue-200 p-5 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <FileBox className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest">{t.codigo}</p>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{t.nome}</h3>
              {t.descricao && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.descricao}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                <span><strong className="text-slate-700">{t.campos.length}</strong> campos</span>
                <span>Retenção: <strong className="text-slate-700">{t.retencao_meses}m</strong></span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 shrink-0 mt-1" />
          </div>
        </Link>
      ))}
    </div>
  )
}
