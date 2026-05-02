import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { countUnreadNotificacoes, getNotificacoes } from '@/lib/queries/notificacoes'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, unreadCount, notifications] = await Promise.all([
    supabase.from('usuarios').select('nome').eq('id', user.id).single(),
    countUnreadNotificacoes().catch(() => 0),
    getNotificacoes(15).catch(() => []),
  ])

  const userName  = (profile as any)?.nome ?? user.email ?? 'Usuário'
  const userEmail = user.email ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          userName={userName}
          userEmail={userEmail}
          unreadCount={unreadCount}
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
