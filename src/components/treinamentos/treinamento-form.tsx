'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createTreinamento } from '@/lib/actions/treinamentos'
import type { AreaComUnidade, UsuarioBasico } from '@/lib/queries/areas'

const schema = z.object({
  titulo:          z.string().min(3, 'Título obrigatório'),
  descricao:       z.string().optional(),
  instrutor:       z.string().optional(),
  dataTreinamento: z.string().optional(),
  validadeMeses:   z.coerce.number().default(0),
  areaId:          z.string().optional(),
  tipo:            z.string().default('presencial'),
  documentoId:     z.string().optional(),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormData = any

interface Props {
  areas:    AreaComUnidade[]
  usuarios: UsuarioBasico[]
}

const TIPOS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'online',     label: 'Online' },
  { value: 'leitura',    label: 'Leitura' },
]

export function TreinamentoForm({ areas, usuarios }: Readonly<Props>) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [selectedParticipantes, setSelectedParticipantes] = useState<string[]>([])
  const [, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'presencial', validadeMeses: 12 },
  })

  const toggleParticipante = (id: string) => {
    setSelectedParticipantes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const onSubmit = (data: FormData) => {
    setServerError(null)
    startTransition(async () => {
      const res = await createTreinamento({
        titulo:           data.titulo,
        descricao:        data.descricao ?? '',
        instrutor:        data.instrutor ?? '',
        dataTreinamento:  data.dataTreinamento ?? '',
        validadeMeses:    data.validadeMeses ?? 0,
        areaId:           data.areaId ?? '',
        tipo:             data.tipo,
        documentoId:      data.documentoId ?? '',
        participantesIds: selectedParticipantes,
      })
      if (!res.ok) { setServerError(res.error ?? 'Erro ao criar treinamento.'); return }
      router.push(`/treinamentos/${res.id}`)
    })
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'
  const labelCls = 'block text-xs font-bold text-slate-700 mb-1.5'

  return (
    <div className="flex gap-8 items-start">
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-w-0 space-y-5">
        {serverError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{serverError}</div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Dados do Treinamento</h2>

          <div>
            <label className={labelCls}>Título *</label>
            <input {...register('titulo')} placeholder="ex: Treinamento de Qualidade ISO 9001" className={inputCls} />
            {errors.titulo && <p className="text-xs text-red-600 mt-1">{(errors.titulo as any)?.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Descrição</label>
            <textarea {...register('descricao')} rows={2} className={`${inputCls} resize-none`} placeholder="Objetivos, conteúdo programático..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Instrutor</label>
              <input {...register('instrutor')} placeholder="Nome do instrutor" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <select {...register('tipo')} className={inputCls}>
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Data do Treinamento</label>
              <input {...register('dataTreinamento')} type="date" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Validade (meses)</label>
              <input {...register('validadeMeses')} type="number" min={0} placeholder="ex: 12" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Participantes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Participantes ({selectedParticipantes.length} selecionado{selectedParticipantes.length !== 1 ? 's' : ''})
          </h2>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {usuarios.map((u) => (
              <label key={u.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedParticipantes.includes(u.id)}
                  onChange={() => toggleParticipante(u.id)}
                  className="w-4 h-4 rounded accent-blue-700"
                />
                <span className="text-xs font-medium text-slate-700 truncate">{u.nome}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
            Criar Treinamento
          </button>
        </div>
      </form>

      {/* Sidebar */}
      <aside className="w-72 shrink-0 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configurações</h3>
          <div>
            <label className={labelCls}>Área</label>
            <select {...register('areaId')} className={inputCls}>
              <option value="">Selecionar área...</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.nome} — {a.unidade?.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </aside>
    </div>
  )
}
