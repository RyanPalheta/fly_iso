'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createCapa } from '@/lib/actions/capa'
import type { UsuarioBasico } from '@/lib/queries/areas'

interface NCOpcao { id: string; codigo: string; titulo: string }

interface CapaFormProps {
  ncs:        NCOpcao[]
  usuarios:   UsuarioBasico[]
  usuarioAtualId: string
  ncIdPresel?: string   // pré-seleciona a NC vinda da query string
}

const capaSchema = z.object({
  ncId:          z.string().min(1, 'Selecione a NC vinculada.'),
  tipo:          z.enum(['corretiva', 'preventiva']),
  descricao:     z.string().min(20, 'Descreva com pelo menos 20 caracteres.'),
  responsavelId: z.string().min(1, 'Selecione o responsável.'),
  prazoGeral:    z.string().min(1, 'Informe o prazo geral.'),
})

type CapaFormData = z.infer<typeof capaSchema>

export function CapaForm({ ncs, usuarios, usuarioAtualId, ncIdPresel }: Readonly<CapaFormProps>) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CapaFormData>({
    resolver: zodResolver(capaSchema),
    defaultValues: {
      ncId:          ncIdPresel ?? (ncs[0]?.id ?? ''),
      tipo:          'corretiva',
      responsavelId: usuarioAtualId,
    },
  })

  const tipo = watch('tipo')

  const onSubmit = async (data: CapaFormData) => {
    setServerError(null)
    const result = await createCapa({
      ncId:          data.ncId,
      tipo:          data.tipo,
      descricao:     data.descricao,
      responsavelId: data.responsavelId,
      prazoGeral:    data.prazoGeral,
    })
    if (!result.ok) { setServerError(result.error ?? 'Erro desconhecido.'); return }
    router.push(result.id ? `/capa/${result.id}` : '/capa')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-8 items-start">
      {/* Left */}
      <section className="flex-1 min-w-0 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Abrir Nova CAPA
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Registre uma Ação Corretiva ou Preventiva vinculada a uma Não Conformidade.
            A causa raiz e o plano de ação serão preenchidos na tela de detalhe.
          </p>
        </div>

        {serverError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{serverError}</p>
          </div>
        )}

        {/* 01. NC + Tipo */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-5">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="text-blue-700">01.</span> Vínculo e Tipo
          </label>

          <div>
            <label htmlFor="ncId" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Não Conformidade Vinculada
            </label>
            <div className="relative">
              <select
                id="ncId"
                {...register('ncId')}
                className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-700 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none appearance-none pr-10 cursor-pointer"
              >
                <option value="">Selecione a NC...</option>
                {ncs.map((nc) => (
                  <option key={nc.id} value={nc.id}>{nc.codigo} — {nc.titulo}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.ncId && <p className="text-xs text-red-600 mt-1">{errors.ncId.message}</p>}
          </div>

          {/* Tipo toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Tipo de Ação
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['corretiva', 'preventiva'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('tipo', t)}
                  className={cn(
                    'py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all border-2',
                    tipo === t
                      ? t === 'corretiva'
                        ? 'bg-orange-50 text-orange-700 border-orange-300'
                        : 'bg-violet-50 text-violet-700 border-violet-300'
                      : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
                  )}
                >
                  {t === 'corretiva' ? '🔧 Corretiva' : '🛡 Preventiva'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 02. Descrição */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          <label htmlFor="descricao" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            <span className="text-blue-700">02.</span> Descrição da Ação
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Descreva o objetivo desta CAPA: o que será corrigido ou prevenido.
          </p>
          <textarea
            id="descricao"
            rows={5}
            placeholder="Exemplo: Implementar rotina de verificação diária dos sensores T5 para garantir a calibração dentro dos parâmetros CCP-2..."
            className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none"
            {...register('descricao')}
          />
          {errors.descricao && <p className="text-xs text-red-600 mt-2">{errors.descricao.message}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-br from-blue-700 to-blue-600 hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Criando…' : 'Abrir CAPA ▸'}
          </button>
        </div>
      </section>

      {/* Right sidebar */}
      <aside className="w-80 shrink-0 space-y-5 sticky top-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-5">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Atribuição
          </h3>

          <div>
            <label htmlFor="responsavelId" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Responsável
            </label>
            <div className="relative">
              <select
                id="responsavelId"
                {...register('responsavelId')}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-900 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none appearance-none pr-9 cursor-pointer"
              >
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="prazoGeral" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Prazo Geral
            </label>
            <input
              id="prazoGeral"
              type="date"
              {...register('prazoGeral')}
              className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-900 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
            />
            {errors.prazoGeral && <p className="text-xs text-red-600 mt-1">{errors.prazoGeral.message}</p>}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 ring-1 ring-blue-200/40 text-xs text-slate-600 leading-relaxed">
          <p className="font-bold text-blue-900 mb-1">Próximos passos após criar:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-500">
            <li>Preencher os 5 Porquês na tela de detalhe</li>
            <li>Criar o plano de ação (o quê / quem / quando)</li>
            <li>Avançar o status conforme execução</li>
            <li>Verificar a eficácia antes de encerrar</li>
          </ol>
        </div>
      </aside>
    </form>
  )
}
