'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function RegistrosError({
  error, reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error('[registros/error]', error)
  }, [error])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Registros</h1>
        <p className="text-sm text-slate-500 mt-1">Erro ao carregar a página</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-900">Falha ao carregar registros</p>
            <p className="text-xs text-red-700 mt-1 font-mono break-all">{error.message}</p>
            {error.digest && (
              <p className="text-[10px] text-red-600 mt-1 font-mono">digest: {error.digest}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          <RotateCcw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900">
        <p className="font-bold mb-1">💡 Possíveis causas:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>A migration <code className="bg-blue-100 px-1 rounded">010_registros_configuraveis.sql</code> não foi aplicada no Supabase</li>
          <li>O cache do PostgREST precisa ser recarregado (Dashboard → Settings → API → Reload schema)</li>
          <li>A variável <code className="bg-blue-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> não está configurada no Vercel</li>
        </ul>
      </div>
    </div>
  )
}
