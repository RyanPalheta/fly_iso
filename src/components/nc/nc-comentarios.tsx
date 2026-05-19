'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Send, MessageSquare, Trash2, Edit2, X, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  criarComentarioNC,
  deletarComentarioNC,
  editarComentarioNC,
} from '@/lib/actions/nc-comentarios'
import type { ComentarioRow } from '@/lib/queries/nc-comentarios-types'

interface NCComentariosProps {
  ncId:               string
  comentarios:        ComentarioRow[]
  usuarioAtualId:     string
  usuarioAtualNome:   string
}

function initials(nome: string | null | undefined): string {
  if (!nome) return '—'
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  <  1) return 'agora'
  if (mins  < 60) return `há ${mins}min`
  if (hours < 24) return `há ${hours}h`
  if (days  <  7) return `há ${days}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Paleta determinística por usuario_id para a cor do avatar. */
const AVATAR_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
]

function avatarColor(id: string | null | undefined): string {
  if (!id) return 'bg-slate-100 text-slate-600'
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

export function NCComentarios({
  ncId, comentarios, usuarioAtualId, usuarioAtualNome,
}: Readonly<NCComentariosProps>) {
  const router = useRouter()
  const [novoTexto, setNovoTexto]   = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handlePost = () => {
    const texto = novoTexto.trim()
    if (!texto) { setError('Escreva algo antes de postar.'); return }
    setError(null)

    startTransition(async () => {
      const result = await criarComentarioNC({ ncId, texto })
      if (!result.ok) { setError(result.error ?? 'Erro ao postar.'); return }
      setNovoTexto('')
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return
    startTransition(async () => {
      const result = await deletarComentarioNC(id, ncId)
      if (!result.ok) { alert(result.error ?? 'Erro ao excluir.'); return }
      router.refresh()
    })
  }

  const handleStartEdit = (c: ComentarioRow) => {
    setEditingId(c.id)
    setEditingText(c.texto)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingText('')
  }

  const handleSaveEdit = () => {
    if (!editingId) return
    const texto = editingText.trim()
    if (!texto) { setError('Comentário não pode ficar vazio.'); return }
    setError(null)
    startTransition(async () => {
      const result = await editarComentarioNC({ comentarioId: editingId, ncId, texto })
      if (!result.ok) { setError(result.error ?? 'Erro ao editar.'); return }
      setEditingId(null)
      setEditingText('')
      router.refresh()
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter ou Cmd+Enter → postar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handlePost()
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          Discussão
          {comentarios.length > 0 && (
            <span className="text-[10px] font-bold text-slate-400">
              ({comentarios.length})
            </span>
          )}
        </h2>
      </div>

      {/* Lista */}
      {comentarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="h-10 w-10 text-slate-200 mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhum comentário ainda</p>
          <p className="text-xs text-slate-400 mt-1">Seja o primeiro a comentar sobre esta NC.</p>
        </div>
      ) : (
        <ul className="space-y-4 mb-5">
          {comentarios.map((c) => {
            const isOwn      = c.usuario?.id === usuarioAtualId
            const isEditing  = editingId === c.id
            const colorCls   = avatarColor(c.usuario?.id)

            return (
              <li key={c.id} className="flex gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  colorCls
                )}>
                  {initials(c.usuario?.nome)}
                </div>
                <div className="flex-1 min-w-0 bg-slate-50 rounded-xl p-4">
                  <div className="flex items-baseline justify-between mb-1.5 gap-2">
                    <div className="flex items-baseline gap-2 min-w-0 flex-1">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {c.usuario?.nome ?? 'Usuário'}
                      </span>
                      {isOwn && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Você
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {relativeTime(c.created_at)}{c.editado ? ' · editado' : ''}
                      </span>
                    </div>

                    {/* Actions (only own) */}
                    {isOwn && !isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(c)}
                          disabled={isPending}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          aria-label="Editar"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          disabled={isPending}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg text-xs text-slate-700 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isPending}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded"
                        >
                          <X className="h-3 w-3" /> Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={isPending}
                          className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded disabled:opacity-50"
                        >
                          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                      {c.texto}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Form novo comentário */}
      <div className="flex gap-3 pt-5 border-t border-slate-100">
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
          avatarColor(usuarioAtualId)
        )}>
          {initials(usuarioAtualNome)}
        </div>
        <div className="flex-1 space-y-2">
          <textarea
            ref={textareaRef}
            value={novoTexto}
            onChange={(e) => setNovoTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva um comentário... (Ctrl+Enter para postar)"
            rows={2}
            disabled={isPending}
            className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none disabled:opacity-60"
          />

          <div className="flex items-center justify-between">
            <span className={cn(
              'text-[10px]',
              novoTexto.length > 1800 ? 'text-red-500 font-bold' : 'text-slate-400'
            )}>
              {novoTexto.length}/2000
            </span>

            <div className="flex items-center gap-3">
              {error && (
                <span className="text-xs text-red-600 font-medium">{error}</span>
              )}
              <button
                type="button"
                onClick={handlePost}
                disabled={isPending || !novoTexto.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Postar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
