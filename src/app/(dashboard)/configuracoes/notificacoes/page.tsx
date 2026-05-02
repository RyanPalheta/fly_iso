import type { Metadata } from 'next'
import { Bell, Mail, BellRing } from 'lucide-react'

export const metadata: Metadata = { title: 'Notificações | Fly ISO' }

const CATEGORIAS = [
  {
    key: 'ncs',
    label: 'Não Conformidades',
    description: 'Alertas sobre abertura, atribuição e vencimento de NCs',
  },
  {
    key: 'capas',
    label: 'CAPAs',
    description: 'Notificações sobre ações corretivas e prazos de CAPA',
  },
  {
    key: 'documentos',
    label: 'Documentos',
    description: 'Avisos de revisão, aprovação e vencimento de documentos',
  },
  {
    key: 'indicadores',
    label: 'Indicadores',
    description: 'Alertas de metas não atingidas e atualizações de KPIs',
  },
  {
    key: 'treinamentos',
    label: 'Treinamentos',
    description: 'Lembretes de treinamentos pendentes e vencimentos',
  },
]

export default function NotificacoesPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Bell className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notificações</h1>
          <p className="text-sm text-slate-500 mt-0.5">Escolha como e quando deseja receber alertas</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-slate-500 font-medium px-1">
        <span className="flex items-center gap-1.5 ml-auto">
          <Mail className="h-3.5 w-3.5" /> E-mail
        </span>
        <span className="flex items-center gap-1.5">
          <BellRing className="h-3.5 w-3.5" /> In-app
        </span>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 divide-y divide-slate-100">
        {CATEGORIAS.map((cat) => (
          <div key={cat.key} className="flex items-center gap-4 px-6 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{cat.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
            </div>

            {/* Email toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="sr-only peer"
                aria-label={`${cat.label} — e-mail`}
              />
              <div className="w-9 h-5 bg-slate-200 peer-checked:bg-blue-600 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-blue-400 peer-focus:ring-offset-1" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
            </label>

            {/* In-app toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="sr-only peer"
                aria-label={`${cat.label} — in-app`}
              />
              <div className="w-9 h-5 bg-slate-200 peer-checked:bg-blue-600 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-blue-400 peer-focus:ring-offset-1" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
            </label>
          </div>
        ))}
      </div>

      {/* Placeholder note */}
      <p className="text-xs text-slate-400 text-center">
        As preferências de notificação serão salvas automaticamente em breve. Por enquanto esta tela é uma prévia da funcionalidade.
      </p>
    </div>
  )
}
