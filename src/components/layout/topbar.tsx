'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, User, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/layout/notification-bell'
import type { NotificacaoRow } from '@/lib/queries/notificacoes-types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopbarProps {
  userName: string
  userEmail: string
  unreadCount: number
  notifications: NotificacaoRow[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  documentos: 'Documentos',
  treinamentos: 'Treinamentos',
  'nao-conformidades': 'Não Conformidades',
  capa: 'CAPA',
  indicadores: 'Indicadores',
  registros: 'Registros',
  'analise-critica': 'Análise Crítica',
  configuracoes: 'Configurações',
  organizacao: 'Organização',
  usuarios: 'Usuários',
  importacao: 'Importação',
  'audit-log': 'Audit Log',
  perfil: 'Meu Perfil',
  notificacoes: 'Notificações',
  nova: 'Nova',
  novo: 'Novo',
}

const UUID_RE = /^[0-9a-f-]{36}$/i

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)

  const crumbs: { label: string; href: string }[] = [
    { label: 'Fly ISO', href: '/dashboard' },
  ]

  let accumulated = ''
  for (const seg of segments) {
    accumulated += `/${seg}`
    // Skip UUIDs, dynamic placeholders, and the 'dashboard' root (already shown as "Fly ISO")
    if (UUID_RE.test(seg) || seg === '[id]' || seg === 'dashboard') continue
    const label = ROUTE_LABELS[seg] ?? seg
    crumbs.push({ label, href: accumulated })
  }

  return crumbs
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Breadcrumb() {
  const pathname = usePathname()
  const crumbs = buildBreadcrumbs(pathname)

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={`${i}-${crumb.href}`} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            )}
            {isLast ? (
              <span className="font-medium text-slate-800">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// User avatar / dropdown
// ---------------------------------------------------------------------------

interface UserMenuProps {
  userName: string
  userEmail: string
}

function UserMenu({ userName, userEmail }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = getInitials(userName)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-blue-700 transition-colors"
        aria-label="Menu do usuário"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/configuracoes/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <User className="h-4 w-4 text-slate-400" />
              Meu Perfil
            </Link>
            <Link
              href="/configuracoes"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Configurações
            </Link>
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function Topbar({ userName, userEmail, unreadCount, notifications }: TopbarProps) {
  return (
    <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6 shadow-sm">
      {/* Left: breadcrumb */}
      <Breadcrumb />

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <NotificationBell initialCount={unreadCount} initialNotifications={notifications} />
        <UserMenu userName={userName} userEmail={userEmail} />
      </div>
    </header>
  )
}
