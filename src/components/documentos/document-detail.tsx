'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download, Edit, ArrowLeft, X, Check, Loader2, Plus, FileText,
  AlertCircle, Info, ExternalLink,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { FileUpload } from '@/components/shared/file-upload'
import { updateDocumento, createVersao } from '@/lib/actions/documentos'
import type { DocumentoComArea } from '@/lib/queries/documentos'
import { cn } from '@/lib/utils'

interface VersaoRow {
  id:                  string
  numero_revisao:      number
  created_at:          string
  descricao_alteracao: string | null
  arquivo_url:         string | null
  arquivo_nome:        string | null
  status:              string
  criador?:            { nome: string } | null
  aprovador?:          { nome: string } | null
}

interface DocumentDetailProps {
  doc:     DocumentoComArea
  versoes: VersaoRow[]
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function DocumentDetail({ doc, versoes }: Readonly<DocumentDetailProps>) {
  const router = useRouter()
  const area = doc.areas?.nome ?? '—'
  const unidade = doc.areas?.unidades?.nome ?? null

  // Versão atual = primeira da lista (ordenada desc)
  const versaoAtual = versoes[0]

  // ── Edição inline ────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false)
  const [editTitulo, setEditTitulo]       = useState(doc.titulo)
  const [editDescricao, setEditDescricao] = useState(doc.descricao ?? '')
  const [editError, setEditError]         = useState<string | null>(null)
  const [isSaving, startSaveTransition] = useTransition()

  const handleSaveEdit = () => {
    if (!editTitulo.trim()) { setEditError('Título obrigatório.'); return }
    setEditError(null)
    startSaveTransition(async () => {
      const result = await updateDocumento({
        id:        doc.id,
        titulo:    editTitulo,
        descricao: editDescricao,
        tipo:      doc.tipo ?? undefined,
      })
      if (!result.ok) { setEditError(result.error ?? 'Erro ao salvar.'); return }
      setIsEditing(false)
      router.refresh()
    })
  }

  const handleCancelEdit = () => {
    setEditTitulo(doc.titulo)
    setEditDescricao(doc.descricao ?? '')
    setEditError(null)
    setIsEditing(false)
  }

  // ── Nova Versão ──────────────────────────────────────────────
  const [showNovaVersao, setShowNovaVersao] = useState(false)
  const [novoArquivo, setNovoArquivo]     = useState<{ url: string; nome: string } | null>(null)
  const [novaDescricao, setNovaDescricao] = useState('')
  const [versaoError, setVersaoError]     = useState<string | null>(null)
  const [isCreatingVersao, startCreateVersao] = useTransition()

  const handleCreateVersao = () => {
    if (!novoArquivo) { setVersaoError('Faça upload do arquivo primeiro.'); return }
    if (!novaDescricao.trim()) {
      setVersaoError('Descreva os itens alterados (obrigatório por ISO).'); return
    }
    setVersaoError(null)
    startCreateVersao(async () => {
      const result = await createVersao({
        documentoId:        doc.id,
        arquivoUrl:         novoArquivo.url,
        arquivoNome:        novoArquivo.nome,
        descricaoAlteracao: novaDescricao,
      })
      if (!result.ok) { setVersaoError(result.error ?? 'Erro ao criar versão.'); return }
      setShowNovaVersao(false)
      setNovoArquivo(null)
      setNovaDescricao('')
      router.refresh()
    })
  }

  const canExport = !!versaoAtual?.arquivo_url

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
            <div className="flex justify-between items-start pb-6 mb-6 border-b border-slate-100 gap-4">
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitulo}
                    onChange={(e) => setEditTitulo(e.target.value)}
                    className="w-full text-3xl font-extrabold text-slate-900 tracking-tight mb-2 bg-blue-50/50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                ) : (
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2 break-words">
                    {doc.titulo}
                  </h1>
                )}
                <div className="flex items-center gap-3 flex-wrap">
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

              {/* Actions */}
              {!isEditing ? (
                <div className="flex gap-2 shrink-0">
                  {canExport ? (
                    <a
                      href={versaoAtual.arquivo_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={versaoAtual.arquivo_nome ?? undefined}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors rounded-lg flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Nenhum arquivo na versão atual — crie uma nova versão para anexar."
                      className="px-4 py-2 text-sm font-semibold text-slate-300 border border-slate-100 rounded-lg flex items-center gap-2 cursor-not-allowed"
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-br from-blue-700 to-blue-600 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Salvar
                  </button>
                </div>
              )}
            </div>

            {/* Descrição (editável inline) */}
            <article className="space-y-4">
              {isEditing ? (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                    Descrição
                  </label>
                  <textarea
                    rows={4}
                    value={editDescricao}
                    onChange={(e) => setEditDescricao(e.target.value)}
                    placeholder="Descreva o propósito e escopo deste documento..."
                    className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                  />
                  {editError && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {editError}
                    </div>
                  )}
                </div>
              ) : doc.descricao ? (
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{doc.descricao}</p>
              ) : (
                <p className="text-slate-400 text-sm italic">Sem descrição cadastrada.</p>
              )}

              {/* Arquivo da versão atual */}
              {versaoAtual?.arquivo_url ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {versaoAtual.arquivo_nome ?? 'Arquivo da versão atual'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Revisão v{versaoAtual.numero_revisao} · {fmt(versaoAtual.created_at)}
                    </p>
                  </div>
                  <a
                    href={versaoAtual.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir
                  </a>
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">
                    Sem arquivo na versão atual
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Clique em &ldquo;Nova Versão&rdquo; ao lado para fazer upload.
                  </p>
                </div>
              )}
            </article>
          </div>

          {/* Nova Versão (expansível) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Nova Versão</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Faça upload do arquivo atualizado e descreva o que mudou (requisito ISO).
                </p>
              </div>
              {!showNovaVersao && (
                <button
                  type="button"
                  onClick={() => setShowNovaVersao(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Nova Versão
                </button>
              )}
            </div>

            {showNovaVersao && (
              <div className="mt-5 space-y-4">
                {/* Banner ISO */}
                <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-4 py-3 ring-1 ring-blue-100">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800">
                    A próxima versão será <strong>v{doc.revisao_atual + 1}</strong>. O documento
                    voltará para o status <strong>&ldquo;Em Revisão&rdquo;</strong> aguardando nova aprovação.
                  </p>
                </div>

                {/* Itens Alterados (obrigatório) */}
                <div>
                  <label
                    htmlFor="descricaoAlteracao"
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
                  >
                    Itens Alterados
                    <span className="text-red-500" title="Obrigatório por requisito normativo">*</span>
                  </label>
                  <textarea
                    id="descricaoAlteracao"
                    rows={3}
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    placeholder="Ex: Atualizado item 5.2 (responsabilidades), incluído fluxograma na seção 7..."
                    className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                  />
                </div>

                {/* Upload */}
                {novoArquivo ? (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 flex-1 truncate">
                      {novoArquivo.nome}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNovoArquivo(null)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded"
                      aria-label="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <FileUpload
                    bucket="documentos"
                    path={`${doc.codigo}/v${doc.revisao_atual + 1}-`}
                    accept="application/pdf,.doc,.docx,.xlsx,.xls"
                    maxSizeMB={20}
                    label="Arraste o arquivo aqui ou clique para selecionar (PDF, DOCX, XLSX)"
                    onUpload={(url, nome) => setNovoArquivo({ url, nome })}
                    onError={(msg) => setVersaoError(msg)}
                  />
                )}

                {versaoError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 ring-1 ring-red-100 rounded-lg px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {versaoError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNovaVersao(false)
                      setNovoArquivo(null)
                      setNovaDescricao('')
                      setVersaoError(null)
                    }}
                    disabled={isCreatingVersao}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateVersao}
                    disabled={isCreatingVersao}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    {isCreatingVersao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Publicar v{doc.revisao_atual + 1}
                  </button>
                </div>
              </div>
            )}
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
                      className={cn(
                        'absolute left-0 top-1.5 w-5 h-5 rounded-full flex items-center justify-center',
                        i === 0 ? 'bg-blue-700 ring-4 ring-blue-700/10' : 'bg-slate-200'
                      )}
                    >
                      <div
                        className={cn(
                          'rounded-full',
                          i === 0 ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-slate-400'
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'text-xs font-bold leading-snug',
                        i === 0 ? 'text-slate-900' : 'text-slate-500'
                      )}>
                        v{v.numero_revisao}
                      </p>
                      {v.arquivo_url && (
                        <a
                          href={v.arquivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:underline"
                          title={v.arquivo_nome ?? ''}
                        >
                          ↗ arquivo
                        </a>
                      )}
                    </div>
                    {v.descricao_alteracao && (
                      <p className="text-[11px] text-slate-600 mt-0.5 break-words">
                        {v.descricao_alteracao}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {fmt(v.created_at)} · {v.criador?.nome ?? '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
