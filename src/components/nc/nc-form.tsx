'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { UploadCloud, Sparkles, ChevronDown, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createNC } from '@/lib/actions/nc'
import type { AreaComUnidade, UsuarioBasico } from '@/lib/queries/areas'
import type { NCOrigem, NCTipoAcao } from '@/types/database'

const ncSchema = z.object({
  descricaoOcorrencia: z.string().min(20, 'Descreva com pelo menos 20 caracteres.'),
  analiseImpacto:      z.string().min(10, 'Analise o impacto em pelo menos 10 caracteres.'),
  clausulaIso:         z.string().min(1, 'Selecione uma cláusula.'),
  gravidade:           z.enum(['menor', 'maior', 'critica']),
  origem:              z.string().min(1, 'Selecione a origem.'),
  areaId:              z.string().min(1, 'Selecione a área.'),
  responsavelId:       z.string().min(1, 'Selecione o responsável.'),
  tipoAcao:            z.enum(['corretiva', 'preventiva']),
  acaoImediata:        z.string().optional(),
})

type NCFormData = z.infer<typeof ncSchema>

const CLAUSULAS_ISO = [
  '4.1 — Contexto da organização',
  '4.2 — Partes interessadas',
  '7.1.5 — Recursos de monitoramento e medição',
  '7.5.3 — Controle de informação documentada',
  '8.4 — Controle de processos, produtos e serviços providos externamente',
  '8.5.1 — Controle da produção e provisão de serviços',
  '8.5.2 — Identificação e rastreabilidade',
  '8.7 — Controle de saídas não conformes',
  '9.1.1 — Generalidades do monitoramento',
  '9.1.2 — Satisfação do cliente',
  '10.2 — Não conformidade e ação corretiva',
]

const ORIGENS: { value: NCOrigem; label: string }[] = [
  { value: 'auditoria_interna', label: 'Auditoria Interna' },
  { value: 'auditoria_externa', label: 'Auditoria Externa' },
  { value: 'cliente',           label: 'Reclamação de Cliente' },
  { value: 'processo',          label: 'Desvio de Processo' },
  { value: 'indicador',         label: 'Indicador Abaixo da Meta' },
]

interface NCFormProps {
  areas:    AreaComUnidade[]
  usuarios: UsuarioBasico[]
  usuarioAtualId: string
}

export function NCForm({ areas, usuarios, usuarioAtualId }: Readonly<NCFormProps>) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NCFormData>({
    resolver: zodResolver(ncSchema),
    defaultValues: {
      gravidade:     'maior',
      origem:        'processo',
      areaId:        areas[0]?.id ?? '',
      responsavelId: usuarioAtualId,
      tipoAcao:      'corretiva',
      acaoImediata:  '',
    },
  })

  const gravidade = watch('gravidade')
  const origem    = watch('origem')
  const tipoAcao  = watch('tipoAcao')

  // Auto-sugestão: NCs originadas de auditoria são sempre corretivas (NC já ocorreu)
  // NCs vindas de indicador podem ser preventivas (sinal antecipado)
  const isOrigemAuditoria = origem === 'auditoria_interna' || origem === 'auditoria_externa' || origem === 'cliente'

  const onSubmit = async (data: NCFormData) => {
    setServerError(null)
    const result = await createNC({
      titulo:         data.descricaoOcorrencia.slice(0, 80),
      descricao:      data.descricaoOcorrencia,
      analiseImpacto: data.analiseImpacto,
      clausulaIso:    data.clausulaIso,
      gravidade:      data.gravidade,
      origem:         data.origem as NCOrigem,
      areaId:         data.areaId,
      responsavelId:  data.responsavelId,
      tipoAcao:       data.tipoAcao as NCTipoAcao,
      acaoImediata:   data.acaoImediata?.trim() || undefined,
    })

    if (!result.ok) {
      setServerError(result.error ?? 'Erro desconhecido.')
      return
    }

    // Navega para o detalhe da NC recém-criada
    router.push(result.id ? `/nao-conformidades/${result.id}` : '/nao-conformidades')
  }

  const GRAVIDADE_OPTS = [
    { value: 'maior',   label: 'Maior',   active: 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' },
    { value: 'menor',   label: 'Menor',   active: 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300' },
    { value: 'critica', label: 'Crítica', active: 'bg-red-100 text-red-700 ring-2 ring-red-300' },
  ] as const

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-8 items-start">
      {/* ── Left: form ── */}
      <section className="flex-1 min-w-0 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Registrar Nova Não Conformidade
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Detalhe o desvio de qualidade com precisão. Certifique-se de que todas as
            descrições sejam factuais e referenciadas com as cláusulas relevantes da ISO 9001:2015.
          </p>
        </div>

        {/* Server error */}
        {serverError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{serverError}</p>
          </div>
        )}

        {/* 01. Descrição */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          <label
            htmlFor="descricaoOcorrencia"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3"
          >
            <span className="text-blue-700">01.</span> Descrição da Ocorrência
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Forneça um relato claro e objetivo: inclua o quê, onde e quando ocorreu.
          </p>
          <textarea
            id="descricaoOcorrencia"
            rows={5}
            placeholder="Exemplo: Durante a inspeção final de montagem do Lote #862, três unidades foram identificadas com sensores ópticos desalinhados..."
            className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none"
            {...register('descricaoOcorrencia')}
          />
          {errors.descricaoOcorrencia && (
            <p className="text-xs text-red-600 mt-2">{errors.descricaoOcorrencia.message}</p>
          )}
        </div>

        {/* 02. Análise */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-5">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="text-blue-700">02.</span> Análise e Contexto Regulatório
          </label>

          <div>
            <label
              htmlFor="analiseImpacto"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
            >
              Análise de Impacto
            </label>
            <textarea
              id="analiseImpacto"
              rows={3}
              placeholder="Explique por que este evento constitui uma falha no atendimento aos requisitos."
              className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none"
              {...register('analiseImpacto')}
            />
            {errors.analiseImpacto && (
              <p className="text-xs text-red-600 mt-2">{errors.analiseImpacto.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="clausulaIso"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
            >
              Vínculo com Cláusula ISO 9001
            </label>
            <div className="relative">
              <select
                id="clausulaIso"
                className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-700 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none appearance-none pr-10 cursor-pointer"
                {...register('clausulaIso')}
              >
                <option value="">Selecione a cláusula aplicável...</option>
                {CLAUSULAS_ISO.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.clausulaIso && (
              <p className="text-xs text-red-600 mt-2">{errors.clausulaIso.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="origem"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
            >
              Origem da NC
            </label>
            <div className="relative">
              <select
                id="origem"
                className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-700 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none appearance-none pr-10 cursor-pointer"
                {...register('origem')}
              >
                {ORIGENS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 03. Tipo de Ação + Ação Imediata */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-5">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="text-blue-700">03.</span> Tipo de Ação & Contenção
          </label>

          {/* Tipo de Ação */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Tipo de Ação
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('tipoAcao', 'corretiva')}
                className={cn(
                  'p-4 rounded-xl text-left transition-all',
                  tipoAcao === 'corretiva'
                    ? 'bg-orange-50 ring-2 ring-orange-300'
                    : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                )}
              >
                <p className={cn(
                  'text-sm font-bold mb-0.5',
                  tipoAcao === 'corretiva' ? 'text-orange-800' : 'text-slate-700'
                )}>
                  Corretiva
                </p>
                <p className={cn(
                  'text-xs',
                  tipoAcao === 'corretiva' ? 'text-orange-600' : 'text-slate-500'
                )}>
                  A NC já ocorreu — agir sobre a causa raiz.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setValue('tipoAcao', 'preventiva')}
                className={cn(
                  'p-4 rounded-xl text-left transition-all',
                  tipoAcao === 'preventiva'
                    ? 'bg-violet-50 ring-2 ring-violet-300'
                    : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                )}
              >
                <p className={cn(
                  'text-sm font-bold mb-0.5',
                  tipoAcao === 'preventiva' ? 'text-violet-800' : 'text-slate-700'
                )}>
                  Preventiva
                </p>
                <p className={cn(
                  'text-xs',
                  tipoAcao === 'preventiva' ? 'text-violet-600' : 'text-slate-500'
                )}>
                  Risco identificado — agir antes de ocorrer.
                </p>
              </button>
            </div>

            {isOrigemAuditoria && tipoAcao === 'preventiva' && (
              <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 ring-1 ring-amber-200">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p>NCs vindas de auditoria ou cliente normalmente são <strong>corretivas</strong> (já ocorreram).</p>
              </div>
            )}
          </div>

          {/* Ação Imediata (opcional) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="acaoImediata"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Ação Imediata
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Opcional</span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Contenção: ação sobre o <em>efeito</em> do problema (não sobre a causa raiz).
              Será registrada antes da análise da causa.
            </p>
            <textarea
              id="acaoImediata"
              rows={2}
              placeholder="Ex: Isolar o lote afetado e suspender expedição até análise concluída."
              className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none"
              {...register('acaoImediata')}
            />
          </div>
        </div>

        {/* 04. Evidências */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            <span className="text-blue-700">04.</span> Evidências de Suporte
          </label>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center hover:bg-slate-50/50 transition-colors">
            <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl mx-auto flex items-center justify-center mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Arraste e solte arquivos de evidência</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Fotografias, logs de sensores ou relatórios em PDF (máx. 10MB)
            </p>
            <button
              type="button"
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Procurar Arquivos
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar e Descartar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-br from-blue-700 to-blue-600 hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Registrando…' : 'Registrar Não Conformidade ▸'}
          </button>
        </div>
      </section>

      {/* ── Right: Classification sidebar ── */}
      <aside className="w-80 shrink-0 space-y-5 sticky top-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Classificação
          </h3>

          {/* Gravidade */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Nível de Gravidade
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GRAVIDADE_OPTS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setValue('gravidade', g.value)}
                  className={cn(
                    'py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all',
                    gravidade === g.value ? g.active : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
            {errors.gravidade && (
              <p className="text-xs text-red-600 mt-1">{errors.gravidade.message}</p>
            )}
          </div>

          {/* Área */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="areaId"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5"
              >
                Área / Departamento
              </label>
              <div className="relative">
                <select
                  id="areaId"
                  {...register('areaId')}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-900 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none appearance-none pr-9 cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}{a.unidade ? ` · ${a.unidade.nome}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.areaId && (
                <p className="text-xs text-red-600 mt-1">{errors.areaId.message}</p>
              )}
            </div>

            {/* Responsável */}
            <div>
              <label
                htmlFor="responsavelId"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5"
              >
                Responsável pela Investigação
              </label>
              <div className="relative">
                <select
                  id="responsavelId"
                  {...register('responsavelId')}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-900 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none appearance-none pr-9 cursor-pointer"
                >
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 ring-1 ring-blue-200/40">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Dica de Qualidade
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Vincule a cláusula ISO correta para que o sistema possa sugerir automaticamente
            a abertura de CAPA e calcular o prazo de resolução conforme o nível de gravidade.
          </p>
        </div>
      </aside>
    </form>
  )
}
