import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CapaForm } from '@/components/capa/capa-form'
import { listUsuariosAtivos } from '@/lib/queries/areas'
import { listNCs } from '@/lib/queries/nao-conformidades'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Nova CAPA | Fly ISO' }

interface Props {
  searchParams: Promise<{ nc?: string }>
}

export default async function NovaCapaPage({ searchParams }: Props) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { nc: ncIdPresel } = await searchParams

  const [ncsRaw, usuarios] = await Promise.all([
    listNCs({ status: ['registrada', 'em_analise', 'em_acao'] }),
    listUsuariosAtivos(),
  ])

  const ncs = ncsRaw.map((n) => ({ id: n.id, codigo: n.codigo, titulo: n.titulo }))

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/capa" className="hover:text-blue-700 transition-colors">CAPA</Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Nova CAPA</span>
      </nav>
      <CapaForm ncs={ncs} usuarios={usuarios} usuarioAtualId={user.id} ncIdPresel={ncIdPresel} />
    </div>
  )
}
