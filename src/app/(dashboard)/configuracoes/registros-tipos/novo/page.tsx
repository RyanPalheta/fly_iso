import type { Metadata } from 'next'
import Link from 'next/link'
import { RegistroTipoForm } from '@/components/registros/registro-tipo-form'

export const metadata: Metadata = { title: 'Novo Tipo de Registro | Fly ISO' }

export default function NovoTipoRegistroPage() {
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/configuracoes/registros-tipos" className="hover:text-blue-700 transition-colors">Tipos de Registro</Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">Novo Tipo</span>
      </nav>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Novo Tipo de Registro</h1>
        <p className="text-sm text-slate-500 mt-1">
          Defina os campos que serão coletados em cada registro deste tipo + prazo de retenção
        </p>
      </div>

      <RegistroTipoForm modo="create" />
    </div>
  )
}
