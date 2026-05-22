import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, FileBox, Clock3, CheckCircle2, XCircle } from 'lucide-react'
import { listRegistroTipos } from '@/lib/queries/registro-tipos'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Tipos de Registro | Fly ISO' }

const DESCARTE_LABEL: Record<string, { label: string; cls: string }> = {
  arquivar:               { label: 'Arquivar',               cls: 'bg-blue-100 text-blue-700' },
  descartar:              { label: 'Descartar',              cls: 'bg-red-100 text-red-700' },
  reter_indefinidamente:  { label: 'Reter indefinidamente',  cls: 'bg-slate-100 text-slate-700' },
}

export default async function RegistroTiposPage() {
  const tipos = await listRegistroTipos()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tipos de Registro</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure templates de registros com campos customizáveis e prazos de retenção — ISO 9001 §7.5
          </p>
        </div>
        <Link
          href="/configuracoes/registros-tipos/novo"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo Tipo
        </Link>
      </div>

      {tipos.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-black/5 p-12 text-center">
          <FileBox className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhum tipo de registro cadastrado.</p>
          <p className="text-xs text-slate-400 mt-1">Crie um tipo para começar a registrar dados estruturados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tipos.map((t) => {
            const descMeta = DESCARTE_LABEL[t.descarte_acao] ?? DESCARTE_LABEL.arquivar
            return (
              <Link
                key={t.id}
                href={`/configuracoes/registros-tipos/${t.id}`}
                className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm hover:shadow-md hover:ring-blue-200 p-5 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <FileBox className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 tracking-widest">{t.codigo}</p>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{t.nome}</h3>
                    </div>
                  </div>
                  {t.ativo ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Ativo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      <XCircle className="h-2.5 w-2.5" /> Inativo
                    </span>
                  )}
                </div>
                {t.descricao && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{t.descricao}</p>
                )}
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-3 border-t border-slate-100">
                  <span><strong className="text-slate-700">{t.campos.length}</strong> campos</span>
                  <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />
                    <strong className="text-slate-700">{t.retencao_meses}</strong> meses
                  </span>
                  <span className={cn('ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold', descMeta.cls)}>
                    {descMeta.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
