'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { marcarComoLida, marcarTodasComoLidas } from '@/lib/actions/notificacoes'
import type { NotificacaoRow } from '@/lib/queries/notificacoes-types'

interface Props {
  initialCount:         number
  initialNotifications: NotificacaoRow[]
}

const TIPO_BORDER: Record<NotificacaoRow['tipo'], string> = {
  info:    'border-blue-400',
  alerta:  'border-amber-400',
  erro:    'border-red-400',
  sucesso: 'border-emerald-400',
}

const TIPO_BG: Record<NotificacaoRow['tipo'], string> = {
  info:    'bg-blue-50',
  alerta:  'bg-amber-50',
  erro:    'bg-red-50',
  sucesso: 'bg-emerald-50',
}

function relativeTime(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  <  1) return 'agora'
  if (mins  < 60) return `há ${mins}min`
  if (hours < 24) return `há ${hours}h`
  return `há ${days}d`
}

const ENTIDADE_HREF: Record<string, string> = {
  nao_conformidades: 'nao-conformidades',
  capas:             'capa',
  documentos:        'documentos',
  indicadores:       'indicadores',
  treinamentos:      'treinamentos',
  registros:         'registros',
  reunioes:          'analise-critica',
}

export function NotificationBell({ initialCount, initialNotifications }: Props) {
  // Local state — optimistic updates so badge reacts instantly (no waiting for router.refresh)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [open, setOpen]       = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const ref                   = useRef<HTMLDivElement>(null)
  const router                = useRouter()
  const [, startTransition]   = useTransition()

  // Sync when server re-renders with fresh props (after router.refresh)
  useEffect(() => { setNotifications(initialNotifications) }, [initialNotifications])

  const unreadCount = notifications.filter(n => !n.lida).length

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setExpandedId(null)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleMarcarTodas() {
    // Optimistic — mark all as read locally immediately
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })))
    startTransition(async () => {
      await marcarTodasComoLidas()
      router.refresh()
    })
    setOpen(false)
    setExpandedId(null)
  }

  function handleToggleExpand(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setExpandedId(prev => prev === id ? null : id)
  }

  function handleMarkRead(e: React.MouseEvent, n: NotificacaoRow) {
    e.stopPropagation()
    if (n.lida) return
    // Optimistic
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, lida: true } : x))
    startTransition(async () => {
      await marcarComoLida(n.id)
      router.refresh()
    })
  }

  function handleNavigate(n: NotificacaoRow) {
    if (!n.entidade || !n.entidade_id) return
    const segment = ENTIDADE_HREF[n.entidade] ?? n.entidade
    // Mark as read optimistically then navigate
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, lida: true } : x))
    startTransition(async () => {
      await marcarComoLida(n.id)
      router.refresh()
    })
    router.push(`/${segment}/${n.entidade_id}`)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setExpandedId(null) }}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl ring-1 ring-black/10 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-700">Notificações</span>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodas}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
                <Bell className="w-8 h-8 text-slate-200" />
                <span className="text-sm">Nenhuma notificação</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((n) => {
                  const isExpanded = expandedId === n.id
                  const hasLink    = !!(n.entidade && n.entidade_id)
                  return (
                    <div
                      key={n.id}
                      className={[
                        'border-l-4 transition-colors',
                        TIPO_BORDER[n.tipo],
                        !n.lida ? TIPO_BG[n.tipo] : 'bg-white',
                      ].join(' ')}
                    >
                      {/* Main row */}
                      <div className="flex items-start gap-2 px-4 py-3">
                        {/* Text block */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-snug ${!n.lida ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                              {n.titulo}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                              {relativeTime(n.created_at)}
                            </span>
                          </div>

                          {/* Collapsed preview */}
                          {!isExpanded && n.mensagem && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{n.mensagem}</p>
                          )}

                          {/* Expanded body */}
                          {isExpanded && (
                            <div className="mt-2 space-y-2">
                              {n.mensagem && (
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                  {n.mensagem}
                                </p>
                              )}
                              <div className="flex items-center gap-3 pt-1">
                                {!n.lida && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleMarkRead(e, n)}
                                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    Marcar como lida
                                  </button>
                                )}
                                {hasLink && (
                                  <button
                                    type="button"
                                    onClick={() => handleNavigate(n)}
                                    className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Ver detalhes
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Expand toggle */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleExpand(e, n.id)}
                          className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-0.5"
                          aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                        >
                          {isExpanded
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2.5">
              <button
                type="button"
                onClick={() => { router.push('/configuracoes/notificacoes'); setOpen(false) }}
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Ver histórico completo →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
