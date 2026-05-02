'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createIndicador } from '@/lib/actions/indicadores'
import type { AreaComUnidade, UsuarioBasico } from '@/lib/queries/areas'

const schema = z.object({
  nome:               z.string().min(3, 'Nome obrigatório (mín. 3 caracteres)'),
  descricao:          z.string().optional(),
  formula:            z.string().optional(),
  unidadeMedida:      z.string().optional(),
  meta:               z.coerce.number().refine((v) => !isNaN(v), { message: 'Meta inválida' }),
  frequencia:         z.string().min(1, 'Selecione a frequência'),
  areaId:             z.string().optional(),
  responsavelId:      z.string().optional(),
  gerarNcAbaixoMeta:  z.boolean().default(false),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormData = any

interface IndicadorFormProps {
  areas:    AreaComUnidade[]
  usuarios: UsuarioBasico[]
}

const FREQUENCIAS = [
  { value: 'mensal',     label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral',  label: 'Semestral' },
  { value: 'anual',      label: 'Anual' },
]

export function IndicadorForm({ areas, usuarios }: Readonly<IndicadorFormProps>) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { frequencia: 'mensal', gerarNcAbaixoMeta: false },
  })

  const onSubmit = (data: FormData) => {
    setServerError(null)
    startTransition(async () => {
      const res = await createIndicador({
        nome:               data.nome,
        descricao:          data.descricao ?? '',
        formula:            data.formula ?? '',
        unidadeMedida:      data.unidadeMedida ?? '',
        meta:               data.meta,
        frequencia:         data.frequencia,
        areaId:             data.areaId ?? '',
        responsavelId:      data.responsavelId ?? '',
        gerarNcAbaixoMeta:  data.gerarNcAbaixoMeta,
      })
      if (!res.ok) { setServerError(res.error ?? 'Erro ao criar indicador.'); return }
      router.push(`/indicadores/${res.id}`)
    })
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'
  const labelCls = 'block text-xs font-bold text-slate-700 mb-1.5'

  return (
    <div className="flex gap-8 items-start">
      {/* Main form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-w-0 space-y-5">
        {serverError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {serverError}
          </div>
        )}

        {/* Identificação */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Identificação</h2>

          <div>
            <label className={labelCls}>Nome do Indicador *</label>
            <input {...register('nome')} placeholder="ex: Taxa de Conformidade de Produtos" className={inputCls} />
            {errors.nome && <p className="text-xs text-red-600 mt-1">{errors.nome?.message as string}</p>}
          </div>

          <div>
            <label className={labelCls}>Descrição</label>
            <textarea {...register('descricao')} rows={2} placeholder="O que mede, como é calculado..." className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Fórmula de Cálculo</label>
            <input {...register('formula')} placeholder="ex: (Itens Conformes / Total) × 100" className={inputCls} />
          </div>
        </div>

        {/* Meta */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Meta e Medição</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Unidade de Medida</label>
              <input {...register('unidadeMedida')} placeholder="ex: %, unidades, horas" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Meta *</label>
              <input {...register('meta')} type="number" step="any" placeholder="ex: 95" className={inputCls} />
              {errors.meta && <p className="text-xs text-red-600 mt-1">{(errors.meta as any)?.message as string}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Frequência de Aferição *</label>
            <select {...register('frequencia')} className={inputCls}>
              {FREQUENCIAS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            {errors.frequencia && <p className="text-xs text-red-600 mt-1">{(errors.frequencia as any)?.message as string}</p>}
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl ring-1 ring-amber-200/50">
            <input
              id="gerarNc"
              type="checkbox"
              {...register('gerarNcAbaixoMeta')}
              className="w-4 h-4 rounded border-slate-300 accent-amber-600 cursor-pointer"
            />
            <label htmlFor="gerarNc" className="text-xs font-semibold text-amber-800 cursor-pointer">
              Gerar NC automaticamente quando resultado ficar abaixo da meta
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
          >
            Criar Indicador
          </button>
        </div>
      </form>

      {/* Sidebar */}
      <aside className="w-72 shrink-0 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Responsabilidade</h3>

          <div>
            <label className={labelCls}>Área</label>
            <select {...register('areaId')} className={inputCls}>
              <option value="">Selecionar área...</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.nome} — {a.unidade?.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Responsável</label>
            <select {...register('responsavelId')} className={inputCls}>
              <option value="">Selecionar usuário...</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </aside>
    </div>
  )
}
