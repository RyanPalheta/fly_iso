'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, FileText, ChevronDown, AlertCircle, Loader2, Check, Tag, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createDocumento } from '@/lib/actions/documentos'
import type { AreaComUnidade, UsuarioBasico } from '@/lib/queries/areas'
import type { DocumentoTipo } from '@/types/database'

interface DocumentFormProps {
  areas:           AreaComUnidade[]
  usuarios:        UsuarioBasico[]
  usuarioAtualId:  string
}

const TIPOS: { value: DocumentoTipo; label: string; desc: string }[] = [
  { value: 'Manual',       label: 'Manual',       desc: 'Documento de nível mais alto do SGQ' },
  { value: 'Procedimento', label: 'Procedimento', desc: 'Sequência de atividades padronizada' },
  { value: 'Instrucao',    label: 'Instrução',    desc: 'Como executar uma tarefa específica' },
  { value: 'Formulario',   label: 'Formulário',   desc: 'Modelo para registro de dados' },
  { value: 'Politica',     label: 'Política',     desc: 'Diretriz organizacional' },
  { value: 'Registro',     label: 'Registro',     desc: 'Evidência de atividade realizada' },
]

export function DocumentForm({ areas, usuarios, usuarioAtualId }: Readonly<DocumentFormProps>) {
  const router = useRouter()

  const [titulo, setTitulo]               = useState('')
  const [tipo, setTipo]                   = useState<DocumentoTipo>('Procedimento')
  const [descricao, setDescricao]         = useState('')
  const [areaId, setAreaId]               = useState(areas[0]?.id ?? '')
  const [responsavelId, setResponsavelId] = useState(usuarioAtualId)
  const [tags, setTags]                   = useState<string[]>([])
  const [tagInput, setTagInput]           = useState('')

  const [error, setError]   = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAddTag = () => {
    const t = tagInput.trim()
    if (!t) return
    if (tags.includes(t)) { setTagInput(''); return }
    setTags([...tags, t])
    setTagInput('')
  }

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((x) => x !== t))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) { setError('Título é obrigatório.'); return }
    if (!areaId)        { setError('Selecione uma área.'); return }
    if (!responsavelId) { setError('Selecione um responsável.'); return }
    setError(null)

    startTransition(async () => {
      const result = await createDocumento({
        titulo,
        tipo,
        descricao,
        areaId,
        responsavelId,
        tags: tags.length > 0 ? tags : undefined,
      })
      if (!result.ok) { setError(result.error ?? 'Erro ao criar documento.'); return }
      router.push(result.id ? `/documentos/${result.id}` : '/documentos')
    })
  }

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
        <span className="text-slate-900 font-semibold">Novo Documento</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-8 items-start">
        <section className="flex-1 min-w-0 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
              Novo Documento
            </h1>
            <p className="text-slate-500 text-sm max-w-2xl">
              Cadastre o documento no SGQ. Após a criação você poderá fazer upload do arquivo
              e submetê-lo para aprovação.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* 01. Identificação */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-5">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-blue-700">01.</span> Identificação
            </label>

            <div>
              <label htmlFor="titulo" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Título do Documento
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Procedimento de Calibração de Equipamentos"
                className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="descricao" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Descrição / Propósito
              </label>
              <textarea
                id="descricao"
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o objetivo, escopo e a quem se aplica este documento..."
                className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* 02. Tipo */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
              <span className="text-blue-700">02.</span> Tipo de Documento
            </label>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={cn(
                    'text-left p-3 rounded-xl transition-all',
                    tipo === t.value
                      ? 'bg-blue-50 ring-2 ring-blue-300'
                      : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                  )}
                >
                  <p className={cn(
                    'text-sm font-bold',
                    tipo === t.value ? 'text-blue-800' : 'text-slate-700'
                  )}>
                    {t.label}
                  </p>
                  <p className={cn(
                    'text-[10px] mt-0.5',
                    tipo === t.value ? 'text-blue-600' : 'text-slate-500'
                  )}>
                    {t.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 03. Tags */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
              <span className="text-blue-700">03.</span> Tags <span className="text-[9px] normal-case text-slate-300 font-medium">(opcional)</span>
            </label>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full px-2.5 py-1"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:bg-blue-200 rounded-full"
                      aria-label={`Remover ${t}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Digite uma tag e pressione Enter (ex: qualidade, calibração)"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-br from-blue-700 to-blue-600 hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isPending ? 'Criando…' : 'Criar Documento'}
            </button>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="w-80 shrink-0 space-y-5 sticky top-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Atribuição
            </h3>

            <div>
              <label htmlFor="areaId" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Área / Departamento
              </label>
              <div className="relative">
                <select
                  id="areaId"
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-900 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none appearance-none pr-9 cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}{a.unidade ? ` · ${a.unidade.nome}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="responsavelId" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Responsável
              </label>
              <div className="relative">
                <select
                  id="responsavelId"
                  value={responsavelId}
                  onChange={(e) => setResponsavelId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-900 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none appearance-none pr-9 cursor-pointer"
                >
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5 ring-1 ring-blue-200/40">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-700" />
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Próximo Passo
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Após criar, você será levado ao detalhe do documento para fazer upload da
              primeira versão (PDF, DOCX, XLSX) e descrever as alterações iniciais.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
