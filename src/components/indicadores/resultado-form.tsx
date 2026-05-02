'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, AlertTriangle } from 'lucide-react'
import { lancarResultado } from '@/lib/actions/indicadores'
import type { IndicadorRow } from '@/lib/queries/indicadores'

const schema = z.object({
  periodo:      z.string().min(4, 'Informe o período (ex: 2026-01)'),
  valor:        z.coerce.number().refine((v) => !isNaN(v), { message: 'Valor inválido' }),
  observacoes:  z.string().optional(),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormData = any

interface ResultadoFormProps {
  indicador: IndicadorRow
}

export function ResultadoForm({ indicador }: Readonly<ResultadoFormProps>) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [abaixoMeta, setAbaixoMeta] = useState(false)
  const [, startTransition] = useTransition()

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const valorWatch = watch('valor')

  const onSubmit = (data: FormData) => {
    setServerError(null)
    startTransition(async () => {
      const res = await lancarResultado({
        indicadorId:  indicador.id,
        periodo:      data.periodo,
        valor:        data.valor,
        observacoes:  data.observacoes ?? '',
      })
      if (!res.ok) {
        setServerError(res.error ?? 'Erro ao salvar resultado.')
        return
      }
      reset()
      setOpen(false)
    })
  }

  const valorAbaixoMeta = indicador.meta !== null && !isNaN(valorWatch) && valorWatch < indicador.meta

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Lançar Resultado
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">Lançar Resultado</h3>
        <button type="button" onClick={() => { setOpen(false); reset() }}>
          <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
        </button>
      </div>

      {serverError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Período *</label>
            <input
              {...register('periodo')}
              placeholder="ex: 2026-01"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {errors.periodo && <p className="text-xs text-red-600 mt-1">{(errors.periodo as any)?.message as string}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Valor *
              {indicador.unidade_medida && (
                <span className="ml-1 text-slate-400 font-normal">({indicador.unidade_medida})</span>
              )}
            </label>
            <input
              {...register('valor')}
              type="number"
              step="any"
              placeholder={indicador.meta !== null ? `Meta: ${indicador.meta}` : '0'}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {errors.valor && <p className="text-xs text-red-600 mt-1">{(errors.valor as any)?.message as string}</p>}
          </div>
        </div>

        {valorAbaixoMeta && indicador.gerar_nc_abaixo_meta && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Valor abaixo da meta — uma NC será gerada automaticamente.</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Observações</label>
          <textarea
            {...register('observacoes')}
            rows={2}
            placeholder="Contexto, justificativas, plano de melhoria..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => { setOpen(false); reset() }}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition-colors"
          >
            Salvar Resultado
          </button>
        </div>
      </form>
    </div>
  )
}
