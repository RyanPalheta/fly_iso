import Link from 'next/link'
import { Download, Edit, CheckCircle2, ArrowLeft } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import type { DocumentoComArea } from '@/lib/queries/documentos'

interface VersaoRow {
  id: string
  numero_revisao: number
  created_at: string
  descricao_alteracao: string | null
  status: string
  criador?: { nome: string } | null
  aprovador?: { nome: string } | null
}

interface DocumentDetailProps {
  doc: DocumentoComArea
  versoes: VersaoRow[]
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function DocumentDetail({ doc, versoes }: Readonly<DocumentDetailProps>) {
  const area = doc.areas?.nome ?? '—'
  const unidade = doc.areas?.unidades?.nome ?? null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/documentos"
          className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Documentos
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold truncate">{doc.titulo}</span>
      </div>

      <div className="flex gap-8 items-start">
        {/* Left: Viewer */}
        <section className="flex-1 min-w-0 space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <div className="flex justify-between items-start pb-6 mb-8 border-b border-slate-100">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                  {doc.titulo}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                    {doc.codigo}
                  </span>
                  <span className="text-slate-500 text-sm font-medium">
                    Revisão v{doc.revisao_atual}
                  </span>
                  {doc.tipo && (
                    <span className="text-slate-500 text-sm font-medium">· {doc.tipo}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 shrink-0 ml-4">
                <button className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors rounded-lg flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
                <button className="bg-gradient-to-br from-blue-700 to-blue-600 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <Edit className="h-4 w-4" />
                  Editar Documento
                </button>
              </div>
            </div>

            <article className="space-y-4">
              {doc.descricao ? (
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{doc.descricao}</p>
              ) : (
                <p className="text-slate-400 text-sm italic">Sem descrição cadastrada.</p>
              )}

              <div className="h-48 bg-slate-50 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 mt-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">📄</div>
                  <p className="text-sm font-medium text-slate-500">
                    Arquivo da versão atual (pendente de upload)
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Right: Sidebar */}
        <aside className="w-72 shrink-0 space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Metadados
              </h3>
              <StatusBadge status={doc.status} />
            </div>

            <dl className="space-y-0">
              {[
                { label: 'Código',      value: doc.codigo },
                { label: 'Tipo',        value: doc.tipo ?? '—' },
                { label: 'Área',        value: area },
                { label: 'Unidade',     value: unidade ?? '—' },
                { label: 'Responsável', value: doc.responsavel?.nome ?? '—' },
                { label: 'Revisão',     value: `v${doc.revisao_atual}` },
                { label: 'Atualizado',  value: fmt(doc.updated_at) },
              ].map(({ label, value }, i, arr) => (
                <div
                  key={label}
                  className={`flex justify-between items-center py-2.5 ${
                    i < arr.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <dt className="text-xs text-slate-500 font-medium">{label}</dt>
                  <dd className="text-xs font-bold text-slate-900 text-right max-w-[55%] truncate">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Version history */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
              Histórico de Versões
            </h3>

            {versoes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma versão registrada.</p>
            ) : (
              <div className="relative space-y-5">
                <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-slate-100" />
                {versoes.map((v, i) => (
                  <div key={v.id} className="relative pl-8">
                    <div
                      className={`absolute left-0 top-1.5 w-5 h-5 rounded-full flex items-center justify-center ${
                        i === 0
                          ? 'bg-blue-700 ring-4 ring-blue-700/10'
                          : 'bg-slate-200 ring-4 ring-transparent'
                      }`}
                    >
                      <div
                        className={`rounded-full ${
                          i === 0 ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-slate-400'
                        }`}
                      />
                    </div>
                    <p className={`text-xs font-bold leading-snug ${i === 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                      v{v.numero_revisao}
                      {v.descricao_alteracao ? ` — ${v.descricao_alteracao}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {fmt(v.created_at)} · {v.criador?.nome ?? '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Distribution placeholder */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Status de Distribuição
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-slate-300" />
              Distribuição não iniciada para esta revisão.
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
