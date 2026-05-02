import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { UserCircle, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { PerfilForm } from '@/components/configuracoes/perfil-form'

export const metadata: Metadata = { title: 'Meu Perfil | Fly ISO' }

export default async function PerfilPage() {
  const userSb = await createClient()
  const { data: { user } } = await userSb.auth.getUser()
  if (!user) redirect('/login')

  const sb = createServiceClient() as any
  const { data: usuario } = await sb
    .from('usuarios')
    .select('id, nome, email, avatar_url')
    .eq('id', user.id)
    .single()

  const nome      = usuario?.nome  ?? user.email ?? 'Usuário'
  const email     = usuario?.email ?? user.email ?? ''
  const avatarUrl = usuario?.avatar_url as string | null

  // Build initials for avatar placeholder
  const initials = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('')

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Meu Perfil</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar + info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 flex items-center gap-5">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={nome}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
            {initials || <UserCircle className="h-8 w-8" />}
          </div>
        )}
        <div>
          <p className="font-bold text-slate-900 text-lg">{nome}</p>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Mail className="h-3.5 w-3.5" />
            {email}
          </p>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Informações pessoais</h2>
        <PerfilForm defaultNome={nome} />
      </div>

      {/* Danger zone / info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-slate-500" />
          Segurança
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-700">E-mail da conta</p>
              <p className="text-xs text-slate-500 mt-0.5">{email}</p>
              <p className="text-[10px] text-slate-400 mt-1">O e-mail não pode ser alterado por aqui.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Lock className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-700">Senha</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Para alterar sua senha, utilize o link de redefinição enviado por e-mail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
