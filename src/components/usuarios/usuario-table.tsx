'use client'

import { useTransition } from 'react'
import { Power, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateUsuarioPerfil, toggleUsuarioAtivo } from '@/lib/actions/usuarios'
import type { UsuarioComPerfil, PerfilRow } from '@/lib/queries/usuarios'

interface Props {
  usuarios: UsuarioComPerfil[]
  perfis:   PerfilRow[]
}

const PERFIL_COLORS: Record<string, string> = {
  Admin:      'bg-red-100 text-red-700',
  Qualidade:  'bg-blue-100 text-blue-700',
  Lider:      'bg-violet-100 text-violet-700',
  Usuario:    'bg-slate-100 text-slate-600',
  Auditor:    'bg-amber-100 text-amber-700',
}

function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function AvatarColors(nome: string): string {
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']
  const hash = nome.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function PerfilSelect({ userId, perfilId, perfis }: Readonly<{ userId: string; perfilId: string | null; perfis: PerfilRow[] }>) {
  const [, start] = useTransition()
  return (
    <select
      value={perfilId ?? ''}
      onChange={(e) => start(async () => { await updateUsuarioPerfil(userId, e.target.value) })}
      className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white cursor-pointer"
    >
      <option value="">Sem perfil</option>
      {perfis.map((p) => (
        <option key={p.id} value={p.id}>{p.nome}</option>
      ))}
    </select>
  )
}

function ToggleBtn({ userId, ativo }: Readonly<{ userId: string; ativo: boolean }>) {
  const [, start] = useTransition()
  return (
    <button
      type="button"
      title={ativo ? 'Desativar usuário' : 'Ativar usuário'}
      onClick={() => start(async () => { await toggleUsuarioAtivo(userId, !ativo) })}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        ativo ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
      )}
    >
      <Power className="h-4 w-4" />
    </button>
  )
}

export function UsuarioTable({ usuarios, perfis }: Readonly<Props>) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">Usuários do Sistema</h2>
        <p className="text-xs text-slate-500 mt-0.5">{usuarios.length} usuário(s) cadastrado(s)</p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {['Usuário', 'Email', 'Perfil', 'Unidades', 'Status', 'Ações'].map((h) => (
              <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 first:pl-6 last:pr-6">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => {
            const perfilNome = u.perfis?.nome ?? null
            const unidades = u.usuario_unidades?.map((uu) => uu.unidades?.nome).filter(Boolean) ?? []

            return (
              <tr key={u.id} className={cn('border-b border-slate-50 hover:bg-slate-50/70 transition-colors', !u.ativo && 'opacity-50')}>
                <td className="px-4 py-3.5 pl-6">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', AvatarColors(u.nome))}>
                      {initials(u.nome)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{u.nome}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-600">{u.email}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    {perfilNome && (
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1', PERFIL_COLORS[perfilNome] ?? 'bg-slate-100 text-slate-600')}>
                        <Shield className="h-2.5 w-2.5" />
                        {perfilNome}
                      </span>
                    )}
                    <PerfilSelect userId={u.id} perfilId={u.perfil_id} perfis={perfis} />
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {unidades.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {unidades.map((un) => (
                        <span key={un} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">{un}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold',
                    u.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  )}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3.5 pr-6">
                  <ToggleBtn userId={u.id} ativo={u.ativo} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
