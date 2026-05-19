'use client'

import Link from 'next/link'
import {
  ArrowLeft, Edit3, FileImage, FileText, FileCode, FileQuestion,
  Check, CheckCircle2, Clock, UserCircle,
} from 'lucide-react'
import type { NCComRelacoes } from '@/lib/queries/nao-conformidades'
import type { ComentarioRow } from '@/lib/queries/nc-comentarios-types'
import { NCComentarios } from '@/components/nc/nc-comentarios'
import { NCShareButton } from '@/components/nc/nc-share-button'
import { cn } from '@/lib/utils'

interface NCDetailProps {
  nc:                NCComRelacoes
  comentarios:       ComentarioRow[]
  usuarioAtualId:    string
  usuarioAtualNome:  string
}

const SEVERIDADE_LABEL: Record<string, { label: string; cls: string }> = {
  menor:   { label: 'Gravidade Menor',  cls: 'bg-yellow-100 text-yellow-700' },
  maior:   { label: 'Gravidade Maior',  cls: 'bg-orange-100 text-orange-700' },
  critica: { label: 'Gravidade Crítica', cls: 'bg-red-100 text-red-700' },
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(nome: string | null | undefined): string {
  if (!nome) return '—'
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Detecta tipo do arquivo pelo nome/URL para escolher ícone + cor. */
function detectFileType(filename: string): 'image' | 'pdf' | 'doc' | 'sheet' | 'log' | 'other' {
  const lower = filename.toLowerCase()
  if (/\.(png|jpe?g|webp|gif|bmp|svg)$/.test(lower)) return 'image'
  if (lower.endsWith('.pdf')) return 'pdf'
  if (/\.(docx?|odt)$/.test(lower)) return 'doc'
  if (/\.(xlsx?|csv|tsv|ods)$/.test(lower)) return 'sheet'
  if (/\.(log|txt|json|xml|yaml)$/.test(lower)) return 'log'
  return 'other'
}

interface EvidenciaShape { url: string; nome: string }

/** Parseia evidencia_urls (JSONB) — aceita formato novo {url,nome} ou legado string[]. */
function parseEvidencias(raw: unknown): EvidenciaShape[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (typeof item === 'string') {
      const fname = item.split('/').pop() ?? item
      return { url: item, nome: fname }
    }
    if (item && typeof item === 'object' && 'url' in item) {
      const obj = item as { url?: unknown; nome?: unknown }
      return {
        url:  typeof obj.url  === 'string' ? obj.url  : '',
        nome: typeof obj.nome === 'string' ? obj.nome : 'arquivo',
      }
    }
    return { url: '', nome: 'arquivo' }
  }).filter((ev) => ev.url)
}

function EvidenceCard({ ev }: Readonly<{ ev: EvidenciaShape }>) {
  const tipo = detectFileType(ev.nome)
  const Icon =
      tipo === 'image' ? FileImage
    : tipo === 'pdf'   ? FileText
    : tipo === 'doc'   ? FileText
    : tipo === 'sheet' ? FileCode
    : tipo === 'log'   ? FileCode
    : FileQuestion

  const bg =
      tipo === 'image' ? 'from-blue-100 to-blue-200'
    : tipo === 'pdf'   ? 'from-red-100 to-red-200'
    : tipo === 'doc'   ? 'from-slate-200 to-slate-300'
    : tipo === 'sheet' ? 'from-emerald-100 to-emerald-200'
    : tipo === 'log'   ? 'from-amber-100 to-amber-200'
    : 'from-slate-100 to-slate-200'

  const isImage = tipo === 'image'
  const fileLabel = ev.nome.replace(/\.[^.]+$/, '') // sem extensão

  return (
    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="group cursor-pointer block">
      {isImage ? (
        // Imagens: mostra preview real
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ev.url}
          alt={ev.nome}
          className="aspect-square rounded-xl object-cover bg-slate-100 group-hover:opacity-90 transition-opacity"
        />
      ) : (
        <div className={cn(
          'aspect-square rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:opacity-90 transition-opacity',
          bg
        )}>
          <Icon className="h-10 w-10 text-slate-500" />
        </div>
      )}
      <p className="text-xs font-semibold text-slate-900 mt-2 truncate group-hover:text-blue-700 transition-colors">
        {fileLabel}
      </p>
      <p className="text-[10px] text-slate-400 truncate">{ev.nome}</p>
    </a>
  )
}

const NC_STATUS_FLOW: { status: string; label: string; desc: string }[] = [
  { status: 'registrada',  label: 'Registrada',    desc: 'NC identificada e registrada no sistema' },
  { status: 'em_analise',  label: 'Em Análise',    desc: 'Equipe de qualidade analisando a NC' },
  { status: 'em_acao',     label: 'CAPA Iniciada', desc: 'Plano de ação corretiva em andamento' },
  { status: 'verificacao', label: 'Verificação',   desc: 'Verificando eficácia das ações tomadas' },
  { status: 'encerrada',   label: 'Encerrada',     desc: 'NC encerrada com eficácia confirmada' },
]

const NC_STATUS_ORDER: Record<string, number> = {
  registrada: 0, em_analise: 1, em_acao: 2, verificacao: 3, encerrada: 4,
}

/** Extrai o número da cláusula a partir de strings como "4.1 — Contexto da organização". */
function parseClausula(raw: string | null): { numero: string; titulo: string } {
  if (!raw) return { numero: '—', titulo: '—' }
  // Padrão: "4.1 — Contexto da organização"  ou  "4.1 - Contexto..."  ou apenas "4.1"
  const m = raw.match(/^([\d.]+)\s*[—-]?\s*(.*)$/)
  if (!m) return { numero: raw, titulo: '' }
  return { numero: m[1].trim(), titulo: (m[2] ?? '').trim() }
}

export function NCDetail({
  nc, comentarios, usuarioAtualId, usuarioAtualNome,
}: Readonly<NCDetailProps>) {
  const sev = nc.severidade ? SEVERIDADE_LABEL[nc.severidade] : null
  const detectorNome = nc.detector?.nome ?? 'Sistema'
  const responsavelNome = nc.responsavel?.nome ?? null
  const currentOrder = NC_STATUS_ORDER[nc.status] ?? 0
  const capaJaAberta = nc.status === 'em_acao' || nc.status === 'verificacao' || nc.status === 'encerrada'

  const evidencias = parseEvidencias(nc.evidencia_urls)
  const clausula = parseClausula(nc.requisito_violado)

  // Os campos novos (tipo_acao / acao_imediata) podem não estar tipados se a
  // migração 004 não foi aplicada — acessamos via cast seguro.
  const tipoAcao     = (nc as unknown as { tipo_acao?: string }).tipo_acao
  const acaoImediata = (nc as unknown as { acao_imediata?: string }).acao_imediata

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
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed px-3 py-1.5 rounded-lg"
                title="Edição em breve"
                disabled
              >
                <Edit3 className="h-3.5 w-3.5" />
                Editar Detalhes
              </button>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2 break-words">
              {nc.codigo}: {nc.titulo}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Relatada por {detectorNome} em {fmtDate(nc.created_at)} · {nc.areas?.nome ?? '—'}
              {nc.areas?.unidades?.nome ? ` · ${nc.areas.unidades.nome}` : ''}
            </p>
            <p
              className="text-sm text-slate-600 leading-relaxed mt-5 whitespace-pre-wrap break-words"
              style={{ overflowWrap: 'anywhere' }}
            >
              {nc.descricao}
            </p>
          </div>

          {/* Evidence gallery — usa nc.evidencia_urls (JSONB) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Galeria de Evidências
                {evidencias.length > 0 && (
                  <span className="ml-2 text-[10px] font-bold text-slate-400">
                    {evidencias.length} {evidencias.length === 1 ? 'arquivo' : 'arquivos'}
                  </span>
                )}
              </h2>
            </div>
            {evidencias.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileImage className="h-10 w-10 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-500">Nenhuma evidência anexada</p>
                <p className="text-xs text-slate-400 mt-1">Anexe arquivos no formulário de registro.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {evidencias.map((ev, i) => (
                  <EvidenceCard key={ev.url + i} ev={ev} />
                ))}
              </div>
            )}
          </div>

          {/* Tipo de Ação + Ação Imediata */}
          {(tipoAcao || acaoImediata) && (
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Classificação da Ação</h2>
                {tipoAcao && (
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider',
                    tipoAcao === 'corretiva'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-violet-100 text-violet-700'
                  )}>
                    {tipoAcao === 'corretiva' ? 'Corretiva' : 'Preventiva'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {tipoAcao === 'corretiva'
                  ? 'NC já ocorreu — necessária ação sobre a causa raiz.'
                  : 'Risco identificado — necessária ação antes que ocorra.'}
              </p>

              {acaoImediata && (
                <div className="bg-amber-50 rounded-xl p-4 ring-1 ring-amber-200">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1.5">
                    Ação Imediata (Contenção)
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {acaoImediata}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ISO clause violated — usa nc.requisito_violado parseado */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 ring-1 ring-blue-200/40">
            <div className="flex items-start gap-4">
              <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <span className="font-mono text-sm font-extrabold text-blue-700">
                  {clausula.numero}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">
                  Requisito Violado
                </p>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  ISO 9001:2015 — Cláusula {clausula.numero}
                </h3>
                {clausula.titulo && (
                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    {clausula.titulo}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Comentários — sistema real */}
          <NCComentarios
            ncId={nc.id}
            comentarios={comentarios}
            usuarioAtualId={usuarioAtualId}
            usuarioAtualNome={usuarioAtualNome}
          />
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

          {/* Responsável pela Investigação (real) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Responsável pela Investigação
            </h3>
            {responsavelNome ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                  {initials(responsavelNome)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{responsavelNome}</div>
                  {nc.responsavel?.email && (
                    <div className="text-[10px] text-slate-400 truncate">{nc.responsavel.email}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-slate-400">
                <UserCircle className="h-10 w-10" />
                <span className="text-xs italic">Não designado</span>
              </div>
            )}
          </div>

          {/* Quem detectou */}
          {nc.detector && (
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Detectada por
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">
                  {initials(nc.detector.nome)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{nc.detector.nome}</div>
                  {nc.detector.email && (
                    <div className="text-[10px] text-slate-400 truncate">{nc.detector.email}</div>
                  )}
                </div>
              </div>
            </div>
          )}

        </aside>
      </div>

      {/* Floating share button — WhatsApp, e-mail, copiar link */}
      <NCShareButton
        ncCodigo={nc.codigo}
        ncTitulo={nc.titulo}
        ncSeveridade={sev?.label}
        ncStatus={nc.status}
      />
    </div>
  )
}
