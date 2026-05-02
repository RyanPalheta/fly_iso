import type { Metadata } from 'next'
import { Upload } from 'lucide-react'
import { ImportWizard } from '@/components/importacao/import-wizard'
import { ImportHistory } from '@/components/importacao/import-history'
import { listImportacoes } from '@/lib/actions/importacao'

export const metadata: Metadata = { title: 'Importação | Fly ISO' }

export default async function ConfigImportacaoPage() {
  const importacoes = await listImportacoes()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Upload className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Importação de Dados</h1>
          <p className="text-sm text-slate-500 mt-0.5">Importe registros em massa via CSV com mapeamento inteligente de colunas</p>
        </div>
      </div>

      {/* Wizard */}
      <ImportWizard />

      {/* History */}
      <ImportHistory importacoes={importacoes as any} />
    </div>
  )
}
