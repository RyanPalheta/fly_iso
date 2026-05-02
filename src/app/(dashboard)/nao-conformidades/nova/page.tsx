import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NCForm } from '@/components/nc/nc-form'
import { listAreasComUnidade, listUsuariosAtivos } from '@/lib/queries/areas'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Registrar Não Conformidade | Fly ISO',
}

export default async function NovaNCPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const [areas, usuarios] = await Promise.all([
    listAreasComUnidade(),
    listUsuariosAtivos(),
  ])

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/nao-conformidades" className="hover:text-blue-700 transition-colors">
          Não Conformidades
        </Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Registrar Nova NC</span>
      </nav>
      <NCForm areas={areas} usuarios={usuarios} usuarioAtualId={user.id} />
    </div>
  )
}
