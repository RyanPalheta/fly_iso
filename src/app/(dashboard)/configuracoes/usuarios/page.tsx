import type { Metadata } from 'next'
import { Users2, Shield } from 'lucide-react'
import { UsuarioTable } from '@/components/usuarios/usuario-table'
import { listUsuariosCompleto, getPerfis } from '@/lib/queries/usuarios'

export const metadata: Metadata = { title: 'Usuários & Perfis | Fly ISO' }

export default async function ConfigUsuariosPage() {
  const [usuarios, perfis] = await Promise.all([
    listUsuariosCompleto(),
    getPerfis(),
  ])

  const ativos   = usuarios.filter((u) => u.ativo).length
  const inativos = usuarios.filter((u) => !u.ativo).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Usuários & Perfis</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie usuários, perfis de acesso e unidades</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Usuários', value: usuarios.length, icon: Users2, bg: 'bg-blue-50',    ib: 'bg-blue-100',    ic: 'text-blue-700'    },
          { label: 'Ativos',            value: ativos,          icon: Users2, bg: 'bg-emerald-50', ib: 'bg-emerald-100', ic: 'text-emerald-700' },
          { label: 'Perfis de Acesso',  value: perfis.length,   icon: Shield, bg: 'bg-violet-50',  ib: 'bg-violet-100',  ic: 'text-violet-700'  },
        ].map(({ label, value, icon: Icon, bg, ib, ic }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 ring-1 ring-black/5`}>
            <div className={`w-9 h-9 rounded-xl ${ib} flex items-center justify-center mb-3`}>
              <Icon className={`h-4 w-4 ${ic}`} />
            </div>
            <div className={`text-2xl font-extrabold ${ic}`}>{value}</div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <UsuarioTable usuarios={usuarios} perfis={perfis} />

      {/* Perfis cards */}
      {perfis.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Perfis de Acesso</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {perfis.map((p) => (
              <div key={p.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-700" />
                  <span className="text-sm font-bold text-slate-900">{p.nome}</span>
                </div>
                {p.descricao && (
                  <p className="text-xs text-slate-500">{p.descricao}</p>
                )}
                {inativos > 0 && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    {usuarios.filter((u) => u.perfil_id === p.id).length} usuário(s)
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
