import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChecklistEditor } from '@/components/analise-critica/checklist-editor'
import { getReuniao } from '@/lib/queries/reunioes'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const r = await getReuniao(id)
  return { title: r ? `${r.titulo} | Fly ISO` : 'Reunião | Fly ISO' }
}

const STATUS_META = {
  planejada:    { label: 'Planejada',    cls: 'bg-violet-100 text-violet-700' },
  em_andamento: { label: 'Em Andamento', cls: 'bg-amber-100 text-amber-700' },
  concluida:    { label: 'Concluída',    cls: 'bg-emerald-100 text-emerald-700' },
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function ReuniaoDetailPage({ params }: Props) {
  const { id } = await params
  const reuniao = await getReuniao(id)
  if (!reuniao) notFound()

  const meta = STATUS_META[reuniao.status as keyof typeof STATUS_META] ?? STATUS_META.planejada
  const acoes = reuniao.reuniao_acoes ?? []
  const acoesOk = acoes.filter((a) => a.status === 'concluida').length

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-sm">
        <Link href="/analise-critica" className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" /> Análise Crítica
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-[300px]">{reuniao.titulo}</span>
      </div>

      <div className="flex gap-8 items-start">
        {/* Left */}
        <section className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-3 mb-4">
              <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', meta.cls)}>
                {meta.label}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                {fmtDate(reuniao.data)}
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{reuniao.titulo}</h1>
            {reuniao.ata && (
              <p className="text-sm text-slate-600 leading-relaxed mt-4 whitespace-pre-wrap">{reuniao.ata}</p>
            )}
          </div>

          {/* 12 Inputs Checklist */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <ChecklistEditor items={reuniao.checklist_items ?? []} reuniaoId={reuniao.id} />
          </div>

          {/* Ações */}
          {acoes.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Ações da Reunião</h2>
                <span className="text-xs font-semibold text-slate-500">{acoesOk}/{acoes.length} concluídas</span>
              </div>
              <div className="space-y-3">
                {acoes.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-1.5 shrink-0',
                      a.status === 'concluida' ? 'bg-emerald-500' : a.status === 'em_andamento' ? 'bg-amber-400' : 'bg-slate-300'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{a.descricao}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {a.responsavel?.nome ?? 'Sem responsável'}{a.prazo ? ` · Prazo: ${fmtDate(a.prazo)}` : ''}
                      </p>
                    </div>
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider shrink-0',
                      a.status === 'concluida' ? 'text-emerald-600' : a.status === 'em_andamento' ? 'text-amber-600' : 'text-slate-400'
                    )}>
                      {a.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Informações</h3>
            <dl className="space-y-0">
              {[
                { label: 'Status',       value: meta.label },
                { label: 'Data',         value: fmtDate(reuniao.data) },
                { label: 'Criado por',   value: reuniao.criador?.nome ?? '—' },
                { label: 'Participantes', value: `${reuniao.participantes?.length ?? 0} convidados` },
              ].map(({ label, value }, i, arr) => (
                <div key={label} className={`flex justify-between items-center py-2.5 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <dt className="text-xs text-slate-500 font-medium">{label}</dt>
                  <dd className="text-xs font-bold text-slate-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
