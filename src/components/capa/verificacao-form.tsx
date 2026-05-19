'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, XCircle, ShieldCheck, AlertTriangle,
  FileText, FileImage, FileCode, FileQuestion, X, Loader2, Check, Info,
  Paperclip, MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { registrarVerificacao } from '@/lib/actions/capa'
import { FileUpload } from '@/components/shared/file-upload'

interface AcaoSummary {
  id:             string
  descricao:      string
  prazo:          string | null
  status:         string
  concluida_em:   string | null
  observacao:     string | null
  evidencia_urls: unknown
  responsavel:    { nome: string } | null
}

interface CapaSummary {
  id:            string
  codigo:        string
  descricao:     string | null
  responsavel:   { id: string; nome: string } | null
  nc:            { codigo: string; titulo: string } | null
}

interface VerificacaoFormProps {
  capa:           CapaSummary
  acoes:          AcaoSummary[]
  usuarioAtualId: string
}

interface EvidenciaFile { url: string; nome: string }

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function parseEvidencias(raw: unknown): EvidenciaFile[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (typeof item === 'string') {
      return { url: item, nome: item.split('/').pop() ?? 'arquivo' }
    }
    if (item && typeof item === 'object' && 'url' in item) {
      const o = item as { url?: unknown; nome?: unknown }
      return {
        url:  typeof o.url  === 'string' ? o.url  : '',
        nome: typeof o.nome === 'string' ? o.nome : 'arquivo',
      }
    }
    return { url: '', nome: '' }
  }).filter((e) => e.url)
}

function fileIcon(nome: string) {
  const lower = nome.toLowerCase()
  if (/\.(png|jpe?g|webp|gif|svg)$/.test(lower)) return { Icon: FileImage, cls: 'text-blue-600 bg-blue-50' }
  if (lower.endsWith('.pdf'))                    return { Icon: FileText, cls: 'text-red-600 bg-red-50' }
  if (/\.(xlsx?|csv)$/.test(lower))              return { Icon: FileCode, cls: 'text-emerald-600 bg-emerald-50' }
  if (/\.(docx?|odt)$/.test(lower))              return { Icon: FileText, cls: 'text-slate-600 bg-slate-100' }
  return { Icon: FileQuestion, cls: 'text-slate-500 bg-slate-100' }
}

export function VerificacaoForm({ capa, acoes, usuarioAtualId }: Readonly<VerificacaoFormProps>) {
  const router = useRouter()
  const [eficaz, setEficaz]         = useState<boolean | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [evidencias, setEvidencias]   = useState<EvidenciaFile[]>([])
  const [error, setError]           = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isResponsavel = capa.responsavel?.id === usuarioAtualId

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (eficaz === null) { setError('Selecione se a ação foi eficaz ou não.'); return }
    if (!observacoes.trim()) { setError('Observações são obrigatórias.'); return }
    setError(null)

    startTransition(async () => {
      const result = await registrarVerificacao({
        capaId:        capa.id,
        eficaz,
        observacoes,
        evidenciaUrls: evidencias,
      })
      if (!result.ok) { setError(result.error ?? 'Erro ao registrar.'); return }
      router.push(`/capa/${capa.id}`)
    })
  }

  // Acesso negado se não for o responsável
  if (!isResponsavel) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/capa/${capa.id}`} className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 font-medium">
            <ArrowLeft className="h-4 w-4" />
            Voltar à CAPA
          </Link>
        </div>
        <div className="bg-amber-50 ring-1 ring-amber-200 rounded-2xl p-8 max-w-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-900 mb-1">Acesso restrito</h2>
              <p className="text-sm text-amber-800 leading-relaxed">
                Apenas <strong>{capa.responsavel?.nome ?? 'o responsável designado'}</strong> pode
                registrar a verificação de eficácia desta CAPA.
              </p>
              <p className="text-xs text-amber-700 mt-3">
                Caso precise reatribuir, contate um administrador do Sistema de Gestão da Qualidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-sm">
        <Link href={`/capa/${capa.id}`} className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 font-medium">
          <ArrowLeft className="h-4 w-4" />
          {capa.codigo}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">Verificação de Eficácia</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-8 items-start">
        {/* Left */}
        <section className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-violet-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="h-7 w-7" />
              <span className="text-[10px] font-bold uppercase tracking-widest">ISO 9001 · Cláusula 10.2</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Verificação de Eficácia</h1>
            <p className="text-sm text-blue-100 leading-relaxed max-w-xl">
              Verifique se as ações implementadas eliminaram a causa raiz e impediram a
              recorrência da não conformidade. Este registro é parte obrigatória do CAPA.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Resumo das Ações Implementadas */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Ações Implementadas ({acoes.length})
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">
                Revise as evidências antes de validar a eficácia
              </span>
            </div>

            {acoes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Nenhuma ação concluída para revisar.
              </p>
            ) : (
              <ul className="space-y-3">
                {acoes.map((acao) => {
                  const evidencias = parseEvidencias(acao.evidencia_urls)
                  const hasContext = evidencias.length > 0 || !!acao.observacao?.trim()

                  return (
                    <li
                      key={acao.id}
                      className="border border-slate-100 rounded-xl p-4 bg-slate-50/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Descrição */}
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-snug">
                              {acao.descricao}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {acao.responsavel?.nome ?? '—'} · Concluída em {fmt(acao.concluida_em)}
                            </p>
                          </div>

                          {/* Observação */}
                          {acao.observacao?.trim() && (
                            <div className="bg-white rounded-lg p-2.5 ring-1 ring-slate-100">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageSquare className="h-3 w-3 text-slate-400" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  Observação
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {acao.observacao}
                              </p>
                            </div>
                          )}

                          {/* Evidências */}
                          {evidencias.length > 0 && (
                            <div className="bg-white rounded-lg p-2.5 ring-1 ring-slate-100">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Paperclip className="h-3 w-3 text-slate-400" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  Evidências ({evidencias.length})
                                </span>
                              </div>
                              <ul className="flex flex-wrap gap-1.5">
                                {evidencias.map((ev, i) => {
                                  const { Icon, cls } = fileIcon(ev.nome)
                                  return (
                                    <li key={ev.url + i}>
                                      <a
                                        href={ev.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                          'flex items-center gap-1.5 rounded-md px-2 py-1 max-w-[200px] hover:opacity-80 transition-opacity',
                                          cls
                                        )}
                                        title={ev.nome}
                                      >
                                        <Icon className="h-3 w-3 shrink-0" />
                                        <span className="text-[10px] font-semibold truncate">{ev.nome}</span>
                                      </a>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          )}

                          {!hasContext && (
                            <p className="text-[10px] italic text-slate-400">
                              Sem evidências ou observações registradas para esta ação.
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* 01. Resultado */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
              <span className="text-blue-700">01.</span> A causa raiz foi eliminada?
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEficaz(true)}
                className={cn(
                  'p-5 rounded-xl text-left transition-all',
                  eficaz === true
                    ? 'bg-emerald-50 ring-2 ring-emerald-400'
                    : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className={cn('h-6 w-6', eficaz === true ? 'text-emerald-600' : 'text-slate-400')} />
                  <p className={cn('text-base font-bold', eficaz === true ? 'text-emerald-800' : 'text-slate-700')}>
                    Eficaz
                  </p>
                </div>
                <p className={cn('text-xs', eficaz === true ? 'text-emerald-700' : 'text-slate-500')}>
                  As ações implementadas eliminaram a causa raiz. A NC será encerrada automaticamente.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEficaz(false)}
                className={cn(
                  'p-5 rounded-xl text-left transition-all',
                  eficaz === false
                    ? 'bg-red-50 ring-2 ring-red-400'
                    : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className={cn('h-6 w-6', eficaz === false ? 'text-red-600' : 'text-slate-400')} />
                  <p className={cn('text-base font-bold', eficaz === false ? 'text-red-800' : 'text-slate-700')}>
                    Ineficaz
                  </p>
                </div>
                <p className={cn('text-xs', eficaz === false ? 'text-red-700' : 'text-slate-500')}>
                  A causa raiz persiste. A CAPA será reaberta para novas ações corretivas.
                </p>
              </button>
            </div>
          </div>

          {/* 02. Observações */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <label htmlFor="observacoes" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              <span className="text-blue-700">02.</span> Observações
              <span className="text-red-500 normal-case">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Descreva como a eficácia foi avaliada: testes realizados, métricas monitoradas,
              período de observação, etc. Este registro será auditado.
            </p>
            <textarea
              id="observacoes"
              rows={5}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Após 30 dias de monitoramento, o defeito não voltou a ocorrer. Foram realizadas 3 inspeções amostrais (lotes 1234, 1235, 1236) e nenhuma desconformidade foi identificada..."
              className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none"
            />
          </div>

          {/* 03. Evidências */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-blue-700">03.</span> Evidências (opcional)
            </label>
            <p className="text-xs text-slate-500">
              Anexe relatórios de inspeção, gráficos, fotos ou outros comprovantes.
            </p>

            {evidencias.length > 0 && (
              <ul className="space-y-2">
                {evidencias.map((ev, i) => (
                  <li
                    key={ev.url + i}
                    className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5"
                  >
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{ev.nome}</span>
                    <a href={ev.url} target="_blank" rel="noopener noreferrer"
                       className="text-[10px] font-bold text-emerald-700 hover:underline uppercase tracking-wider">
                      Abrir
                    </a>
                    <button
                      type="button"
                      onClick={() => setEvidencias((prev) => prev.filter((_, j) => j !== i))}
                      className="text-slate-400 hover:text-red-500 p-1 rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <FileUpload
              bucket="evidencias"
              path={`verificacao/${capa.codigo}/`}
              accept="image/*,application/pdf,.xlsx,.xls,.csv"
              maxSizeMB={10}
              label="Arraste arquivos aqui ou clique"
              onUpload={(url, nome) => setEvidencias((prev) => [...prev, { url, nome }])}
              onError={(msg) => setError(msg)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={`/capa/${capa.id}`}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isPending || eficaz === null}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50',
                eficaz === false
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gradient-to-br from-emerald-600 to-emerald-500 hover:opacity-90 text-white'
              )}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isPending
                ? 'Registrando…'
                : eficaz === false ? 'Reabrir CAPA' : 'Confirmar Eficácia & Encerrar'}
            </button>
          </div>
        </section>

        {/* Sidebar — Resumo da CAPA */}
        <aside className="w-80 shrink-0 space-y-5 sticky top-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Resumo da CAPA
            </h3>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Código</p>
              <p className="text-sm font-bold text-slate-900">{capa.codigo}</p>
            </div>
            {capa.nc && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">NC Vinculada</p>
                <Link
                  href={`/nao-conformidades/${capa.nc.codigo}`}
                  className="text-sm font-bold text-blue-700 hover:underline truncate block"
                >
                  {capa.nc.codigo}
                </Link>
                <p className="text-[11px] text-slate-500 line-clamp-2">{capa.nc.titulo}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Verificador</p>
              <p className="text-sm font-bold text-slate-900">{capa.responsavel?.nome ?? '—'}</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5 ring-1 ring-blue-200/40">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-700" />
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Como avaliar eficácia
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Considere período de monitoramento suficiente, métricas mensuráveis e dados objetivos.
              Aprovar prematuramente pode causar recorrência.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
