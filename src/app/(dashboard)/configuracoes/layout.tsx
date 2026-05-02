'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Building2,
  Users2,
  Upload,
  Activity,
  UserCircle,
  Bell,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Organização',     href: '/configuracoes/organizacao',  icon: Building2  },
  { label: 'Usuários & Perfis', href: '/configuracoes/usuarios',   icon: Users2     },
  { label: 'Importação',      href: '/configuracoes/importacao',   icon: Upload     },
  { label: 'Audit Log',       href: '/configuracoes/audit-log',    icon: Activity   },
  { label: 'Meu Perfil',      href: '/configuracoes/perfil',       icon: UserCircle },
  { label: 'Notificações',    href: '/configuracoes/notificacoes', icon: Bell       },
]

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-8 min-h-full">
      {/* Left sub-nav */}
      <aside className="w-56 shrink-0">
        <div className="sticky top-0">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Configurações
          </p>
          <nav>
            <ul className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
