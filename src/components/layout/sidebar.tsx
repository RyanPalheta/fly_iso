'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  FileText,
  GraduationCap,
  AlertTriangle,
  ClipboardList,
  ClipboardCheck,
  BarChart3,
  Archive,
  BarChart2,
  LayoutDashboard,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Dashboard',        href: '/dashboard',                    icon: LayoutDashboard },
  { label: 'Documentos',       href: '/documentos',                   icon: FileText,       modulo: 'documentos' },
  { label: 'Treinamentos',     href: '/treinamentos',                 icon: GraduationCap,  modulo: 'treinamentos' },
  { label: 'Não Conformidades',href: '/nao-conformidades/dashboard',  icon: AlertTriangle,  modulo: 'nc' },
  { label: 'CAPA',             href: '/capa',                         icon: ClipboardList,  modulo: 'capa' },
  { label: 'Auditorias',       href: '/auditorias',                   icon: ClipboardCheck, modulo: 'auditorias' },
  { label: 'Indicadores',      href: '/indicadores',                  icon: BarChart3,      modulo: 'indicadores' },
  { label: 'Registros',        href: '/registros',                    icon: Archive,        modulo: 'registros' },
  { label: 'Análise Crítica',  href: '/analise-critica',              icon: BarChart2,      modulo: 'reunioes' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.modulo === 'nc') return pathname.startsWith('/nao-conformidades')
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <span className="text-lg font-bold tracking-tight">Fly ISO</span>
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground -mt-0.5">ISO 9001</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Módulos</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t px-3 py-3 space-y-0.5">
        <Link
          href="/configuracoes"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith('/configuracoes')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
