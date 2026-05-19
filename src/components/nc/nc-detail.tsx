'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeft, Edit3, FileImage, FileText, FileCode, Plus, Send,
  Share2, Check, CheckCircle2, Clock,
} from 'lucide-react'
import { mockNCDetalhe } from '@/data/mockData'
import type { NCComRelacoes } from '@/lib/queries/nao-conformidades'
import { cn } from '@/lib/utils'

interface NCDetailProps {
  nc: NCComRelacoes
}

const SEVERIDADE_LABEL: Record<string, { label: string; cls: string }> = {
  menor:   { label: 'Gravidade Menor',  cls: 'bg-yellow-100 text-yellow-700' },
  maior:   { label: 'Gravidade Maior',  cls: 'bg-orange-100 text-orange-700' },
  critica: { label: 'Gravidade Crítica', cls: 'bg-red-100 text-red-700' },
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function EvidenceThumbnail({
  tipo, label, nome,
}: Readonly<{ tipo: 'image' | 'pdf' | 'log'; label: string; nome: string }>) {
  const Icon = tipo === 'image' ? FileImage : tipo === 'pdf' ? FileText : FileCode
  const bg =
    tipo === 'image' ? 'from-slate-200 to-slate-300'
    : tipo === 'pdf' ? 'from-red-100 to-red-200'
    : 'from-amber-100 to-amber-200'

  return (
    <div className="group cursor-pointer">
      <div className={cn('aspect-square rounded-xl bg-gradient-to-br flex items-center justify-center', bg)}>
        <Icon className="h-10 w-10 text-slate-500" />
      </div>
      <p className="text-xs font-semibold text-slate-900 mt-2 truncate">{label}</p>
      <p className="text-[10px] text-slate-400 truncate">{nome}</p>
    </div>
  )
}

const NC_STATUS_FLOW: { status: string; label: string; desc: string }[] = [
  { status: 'registrada',  label: 'Registrada',       desc: 'NC identificada e registrada no sistema' },
  { status: 'em_analise',  label: 'Em Análise',        desc: 'Equipe de qualidade analisando a NC' },
  { status: 'em_acao',     label: 'CAPA Iniciada',     desc: 'Plano de ação corretiva em andamento' },
  { status: 'verificacao', label: 'Verificação',       desc: 'Verificando eficácia das ações tomadas' },
  { status: 'encerrada',   label: 'Encerrada',         desc: 'NC encerrada com eficácia confirmada' },
]

const NC_STATUS_ORDER: Record<string, number> = {
  registrada: 0, em_analise: 1, em_acao: 2, verificacao: 3, encerrada: 4,
}

export function NCDetail({ nc }: Readonly<NCDetailProps>) {
  // Dados auxiliares (evidências/comentários) ainda vêm do mock
  // até a modelagem dessas tabelas ser finalizada.
  const mock = mockNCDetalhe
  const [novoComentario, setNovoComentario] = useState('')
  const sev = nc.severidade ? SEVERIDADE_LABEL[nc.severidade] : null
  const detectorNome = nc.detector?.nome ?? 'Auditoria'
  const currentOrder = NC_STATUS_ORDER[nc.status] ?? 0
  const capaJaAberta = nc.status === 'em_acao' || nc.status === 'verificacao' || nc.status === 'encerrada'

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/nao-conformidades"
          className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Não Conformidades
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">Detalhes da {nc.codigo}</span>
      </div>

      <div className="flex gap-8 items-start">
        {/* ── Left: main content ── */}
        <section className="flex-1 min-w-0 space-y-6">
          {/* NC header card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-4">
              {sev ? (
                <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', sev.cls)}>
                  {sev.label}
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Sem classificação
                </span>
              )}
              <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                <Edit3 className="h-3.5 w-3.5" />
                Editar Detalhes
              </button>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              {nc.codigo}: {nc.titulo}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Relatada por {detectorNome} em {fmtDate(nc.created_at)} · {nc.areas?.nome ?? '—'}
              {nc.areas?.unidades?.nome ? ` · ${nc.areas.unidades.nome}` : ''}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mt-5 whitespace-pre-wrap">
              {nc.descricao}
            </p>
          </div>

          {/* Evidence gallery */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Galeria de Evidências</h2>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                <Plus className="h-3.5 w-3.5" />
                Nova Evidência
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {mock.evidencias.map((ev) => (
                <EvidenceThumbnail
                  key={ev.nome}
                  tipo={ev.tipo}
                  label={ev.label}
                  nome={ev.nome}
                />
              ))}
            </div>
          </div>

          {/* Tipo de Ação + Ação Imediata */}
          {((nc as any).tipo_acao || (nc as any).acao_imediata) && (
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Classificação da Ação</h2>
                {(nc as any).tipo_acao && (
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider',
                    (nc as any).tipo_acao === 'corretiva'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-violet-100 text-violet-700'
                  )}>
                    {(nc as any).tipo_acao === 'corretiva' ? 'Corretiva' : 'Preventiva'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {(nc as any).tipo_acao === 'corretiva'
                  ? 'NC já ocorreu — necessária ação sobre a causa raiz.'
                  : 'Risco identificado — necessária ação antes que ocorra.'}
              </p>

              {(nc as any).acao_imediata && (
                <div className="bg-amber-50 rounded-xl p-4 ring-1 ring-amber-200">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1.5">
                    Ação Imediata (Contenção)
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {(nc as any).acao_imediata}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ISO clause violated */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 ring-1 ring-blue-200/40">
            <div className="flex items-start gap-4">
              <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <span className="font-mono text-sm font-extrabold text-blue-700">9.1</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">
                  Requisito Violado
                </p>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  ISO 9001:2015 — Cláusula 9.1.1
                </h3>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  &ldquo;{nc.requisito_violado ?? mock.isoDescricao}&rdquo;
                </p>
                <button className="mt-3 text-[10px] font-bold text-blue-700 uppercase tracking-widest hover:underline">
                  Visualizar cláusula completa →
                </button>
              </div>
            </div>
          </div>

          {/* Audit discussion */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-bold text-slate-900 mb-5">Discussão da Auditoria</h2>

            <div className="space-y-4">
              {mock.comentarios.map((c) => (
                <div key={c.autor + c.tempo} className="flex gap-3">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0', c.avatarBg)}>
                    {c.iniciais}
                  </div>
                  <div className="flex-1 min-w-0 bg-slate-50 rounded-xl p-4">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">{c.autor}</span>
                      <span className="text-[10px] text-slate-400">{c.tempo}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.texto}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* New comment */}
            <div className="flex gap-3 mt-5 pt-5 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                AS
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Adicione um comentário ou marque um colega..."
                  className="w-full pl-4 pr-32 py-3 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!novoComentario.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Send className="h-3 w-3" />
                  Postar
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right sidebar ── */}
        <aside className="w-80 shrink-0 space-y-5">
          {/* Progression */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
              Progressão do Status
            </h3>

            <div className="relative space-y-4">
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-100" />
              {NC_STATUS_FLOW.map((step, i) => {
                const done    = i < currentOrder
                const current = i === currentOrder
                const Icon = done ? CheckCircle2 : current ? Check : Clock
                return (
                  <div key={step.status} className="relative pl-8">
                    <div className={cn(
                      'absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center',
                      current && 'bg-blue-700 ring-4 ring-blue-700/10',
                      done    && 'bg-emerald-400',
                      !current && !done && 'bg-slate-100'
                    )}>
                      <Icon className={cn(
                        'h-3 w-3',
                        current ? 'text-white' : done ? 'text-white' : 'text-slate-400'
                      )} />
                    </div>
                    <p className={cn(
                      'text-xs font-bold leading-snug',
                      current ? 'text-slate-900' : done ? 'text-emerald-600' : 'text-slate-400'
                    )}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                )
              })}
            </div>

            {capaJaAberta ? (
              <Link
                href={`/capa?nc=${nc.id}`}
                className="w-full mt-5 block text-center bg-gradient-to-br from-emerald-600 to-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-90 transition-opacity"
              >
                Ver CAPA Vinculada →
              </Link>
            ) : (
              <Link
                href={`/capa/nova?nc=${nc.id}`}
                className="w-full mt-5 block text-center bg-gradient-to-br from-blue-700 to-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-90 transition-opacity"
              >
                Iniciar CAPA
              </Link>
            )}
          </div>

          {/* Auditor */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Auditor(a) Principal
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                MT
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Marcus Thorne</div>
                <div className="text-[10px] text-slate-400">Auditor Líder</div>
              </div>
            </div>
          </div>

          {/* Floating share btn */}
          <button
            className="fixed bottom-8 right-8 w-14 h-14 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-30"
            aria-label="Compartilhar NC"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </aside>
      </div>
    </div>
  )
}
