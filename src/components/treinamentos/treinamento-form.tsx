'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users, ExternalLink, FileText, Building2, Calendar, Clock, Hash,
  Plus, X, AlertCircle, Loader2, Check, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createTreinamento } from '@/lib/actions/treinamentos'
import type { AreaComUnidade, UsuarioBasico } from '@/lib/queries/areas'
import type { TreinamentoCategoria, TreinamentoTurno } from '@/types/database'

interface DocumentoVigente {
  id: string
  codigo: string
  titulo: string
  tipo: string | null
  revisao_atual: number
  status: string
}

interface Props {
  areas:     AreaComUnidade[]
  usuarios:  UsuarioBasico[]
  documentos: DocumentoVigente[]
  /** Pré-selecionado por query string (?tipo=interno|externo) */
  defaultCategoria?: TreinamentoCategoria
}

interface ParticipanteLocal {
  key:        string
  usuarioId?: string
  nome:       string
  matricula:  string
  setor:      string
  turno:      TreinamentoTurno
}

const TURNOS: Array<{ value: TreinamentoTurno; label: string }> = [
  { value: 'manha',    label: 'Manhã' },
  { value: 'tarde',    label: 'Tarde' },
  { value: 'noite',    label: 'Noite' },
  { value: 'integral', label: 'Integral' },
]

export function TreinamentoForm({ areas, usuarios, documentos, defaultCategoria }: Readonly<Props>) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Categoria default vem do query (?tipo=...)
  const tipoFromQuery = searchParams.get('tipo')
  const initialCategoria: TreinamentoCategoria =
    defaultCategoria ?? (tipoFromQuery === 'externo' ? 'externo' : 'interno')

  // Campos comuns
  const [categoria, setCategoria] = useState<TreinamentoCategoria>(initialCategoria)
  const [titulo, setTitulo]               = useState('')
  const [descricao, setDescricao]         = useState('')
  const [instrutor, setInstrutor]         = useState('')
  const [dataTreinamento, setDataTreinamento] = useState('')
  const [validadeMeses, setValidadeMeses] = useState<number | ''>(12)
  const [areaId, setAreaId]               = useState('')

  // Interno
  const [documentoId, setDocumentoId] = useState('')
  const [tipoInterno, setTipoInterno] = useState<'presencial' | 'leitura'>('presencial')

  // Externo
  const [entidadePromotora, setEntidadePromotora] = useState('')
  const [cargaHoraria, setCargaHoraria]           = useState<number | ''>('')
  const [mesPlanejado, setMesPlanejado]           = useState('')
  const [custo, setCusto]                         = useState<number | ''>('')

  // Participantes
  const [participantes, setParticipantes] = useState<ParticipanteLocal[]>([])
  const [showAddPart, setShowAddPart]     = useState(false)
  const [partUsuarioId, setPartUsuarioId] = useState('')
  const [partNome, setPartNome]           = useState('')
  const [partMatricula, setPartMatricula] = useState('')
  const [partSetor, setPartSetor]         = useState('')
  const [partTurno, setPartTurno]         = useState<TreinamentoTurno>('manha')

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Documento selecionado (para preview da revisão)
  const docSelecionado = documentos.find((d) => d.id === documentoId)

  const handleAddParticipante = () => {
    if (!partNome.trim() && !partUsuarioId) {
      setError('Selecione um usuário ou informe um nome.'); return
    }
    setError(null)

    const usuario = partUsuarioId ? usuarios.find((u) => u.id === partUsuarioId) : null
    const newPart: ParticipanteLocal = {
      key:       crypto.randomUUID(),
      usuarioId: partUsuarioId || undefined,
      nome:      usuario?.nome ?? partNome.trim(),
      matricula: partMatricula.trim(),
      setor:     partSetor.trim(),
      turno:     partTurno,
    }
    setParticipantes((prev) => [...prev, newPart])

    // Reset
    setPartUsuarioId('')
    setPartNome('')
    setPartMatricula('')
    setPartSetor('')
    setPartTurno('manha')
    setShowAddPart(false)
  }

  const handleRemoveParticipante = (key: string) => {
    setParticipantes((prev) => prev.filter((p) => p.key !== key))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!titulo.trim()) { setError('Título é obrigatório.'); return }
    if (categoria === 'interno' && !documentoId) {
      setError('Treinamento interno deve ser vinculado a um documento vigente.'); return
    }
    if (categoria === 'externo' && !entidadePromotora.trim()) {
      setError('Treinamento externo exige entidade promotora.'); return
    }

    startTransition(async () => {
      const result = await createTreinamento({
        categoria,
        titulo,
        descricao,
        instrutor,
        dataTreinamento,
        validadeMeses: typeof validadeMeses === 'number' ? validadeMeses : undefined,
        areaId,
        tipo: categoria === 'interno' ? tipoInterno : 'presencial',
        documentoId:       categoria === 'interno' ? documentoId : undefined,
        entidadePromotora: categoria === 'externo' ? entidadePromotora : undefined,
        cargaHoraria:      categoria === 'externo' && typeof cargaHoraria === 'number' ? cargaHoraria : undefined,
        mesPlanejado:      categoria === 'externo' ? mesPlanejado : undefined,
        custo:             categoria === 'externo' && typeof custo === 'number' ? custo : undefined,
        participantes: participantes.map((p) => ({
          usuarioId: p.usuarioId,
          nome:      p.nome,
          matricula: p.matricula,
          setor:     p.setor,
          turno:     p.turno,
        })),
      })

      if (!result.ok) { setError(result.error ?? 'Erro ao criar treinamento.'); return }
      router.push(`/treinamentos/${result.id}`)
    })
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white'
  const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="flex gap-8 items-start">
      <section className="flex-1 min-w-0 space-y-5">
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* 01. Categoria */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            <span className="text-blue-700">01.</span> Tipo de Treinamento
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCategoria('interno')}
              className={cn(
                'p-4 rounded-xl text-left transition-all',
                categoria === 'interno'
                  ? 'bg-blue-50 ring-2 ring-blue-300'
                  : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
              )}
            >
              <Users className={cn('h-5 w-5 mb-2', categoria === 'interno' ? 'text-blue-700' : 'text-slate-400')} />
              <p className={cn('text-sm font-bold', categoria === 'interno' ? 'text-blue-800' : 'text-slate-700')}>
                Interno
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Vinculado a documento do SGQ — colaboradores próprios.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCategoria('externo')}
              className={cn(
                'p-4 rounded-xl text-left transition-all',
                categoria === 'externo'
                  ? 'bg-violet-50 ring-2 ring-violet-300'
                  : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
              )}
            >
              <ExternalLink className={cn('h-5 w-5 mb-2', categoria === 'externo' ? 'text-violet-700' : 'text-slate-400')} />
              <p className={cn('text-sm font-bold', categoria === 'externo' ? 'text-violet-800' : 'text-slate-700')}>
                Externo
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Curso/certificação com entidade promotora externa.
              </p>
            </button>
          </div>
        </div>

        {/* 02. Identificação */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="text-blue-700">02.</span> Identificação
          </label>

          <div>
            <label className={labelCls}>Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={categoria === 'interno' ? 'Ex: Treinamento de Calibração de Equipamentos' : 'Ex: Lead Auditor ISO 9001 — Bureau Veritas'}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Descrição / Conteúdo Programático</label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Objetivos, ementa, pré-requisitos..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{categoria === 'interno' ? 'Instrutor' : 'Instrutor / Palestrante'}</label>
              <input
                type="text"
                value={instrutor}
                onChange={(e) => setInstrutor(e.target.value)}
                placeholder="Nome completo"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                {categoria === 'interno' ? 'Data do Treinamento' : 'Data de Realização'}
              </label>
              <input
                type="date"
                value={dataTreinamento}
                onChange={(e) => setDataTreinamento(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* 03. Específico por categoria */}
        {categoria === 'interno' ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-blue-700">03.</span> Vinculação ao SGQ
            </label>

            <div>
              <label className={labelCls}>
                Documento Vigente <span className="text-red-500 normal-case">*</span>
              </label>
              {documentos.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Nenhum documento vigente disponível. Aprove documentos primeiro.
                </p>
              ) : (
                <select
                  value={documentoId}
                  onChange={(e) => setDocumentoId(e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="">Selecione um documento...</option>
                  {documentos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.codigo} — {d.titulo} (v{d.revisao_atual})
                    </option>
                  ))}
                </select>
              )}
              {docSelecionado && (
                <div className="mt-2 flex items-start gap-2 bg-blue-50 rounded-lg p-2.5 ring-1 ring-blue-100">
                  <FileText className="h-3.5 w-3.5 text-blue-700 mt-0.5 shrink-0" />
                  <div className="text-xs text-blue-900">
                    Revisão atual: <strong>v{docSelecionado.revisao_atual}</strong> · Status: {docSelecionado.status}
                    <p className="text-[10px] text-blue-700 mt-0.5">
                      A revisão será registrada como snapshot. Se o documento for atualizado, todos os participantes receberão notificação de retreinamento.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>Tipo de Realização</label>
              <div className="grid grid-cols-2 gap-2">
                {(['presencial', 'leitura'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipoInterno(t)}
                    className={cn(
                      'p-3 rounded-lg text-sm font-semibold transition-all',
                      tipoInterno === t
                        ? 'bg-blue-50 ring-2 ring-blue-300 text-blue-800'
                        : 'bg-slate-50 ring-1 ring-slate-200 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {t === 'presencial' ? 'Presencial' : 'Leitura'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-blue-700">03.</span> Dados do Curso Externo
            </label>

            <div>
              <label className={labelCls}>
                Entidade Promotora <span className="text-red-500 normal-case">*</span>
              </label>
              <input
                type="text"
                value={entidadePromotora}
                onChange={(e) => setEntidadePromotora(e.target.value)}
                placeholder="Ex: Bureau Veritas, SENAI, INMETRO"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Carga Horária</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={cargaHoraria}
                    onChange={(e) => setCargaHoraria(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="40"
                    className={`${inputCls} pr-9`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">h</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Mês Planejado</label>
                <input
                  type="month"
                  value={mesPlanejado}
                  onChange={(e) => setMesPlanejado(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Custo (R$)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={custo}
                  onChange={(e) => setCusto(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0,00"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        {/* 04. Participantes (matricula/setor/turno — req. auditor) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-blue-700">04.</span> Participantes ({participantes.length})
            </label>
            {!showAddPart && (
              <button
                type="button"
                onClick={() => setShowAddPart(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            )}
          </div>

          {participantes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <tr className="border-b border-slate-100">
                    <th className="py-2 text-left">Nome</th>
                    <th className="py-2 text-left">Matrícula</th>
                    <th className="py-2 text-left">Setor</th>
                    <th className="py-2 text-left">Turno</th>
                    <th className="py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {participantes.map((p) => (
                    <tr key={p.key} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5">
                        <p className="font-semibold text-slate-800">{p.nome}</p>
                      </td>
                      <td className="py-2.5 text-slate-600 font-mono">{p.matricula || '—'}</td>
                      <td className="py-2.5 text-slate-600">{p.setor || '—'}</td>
                      <td className="py-2.5">
                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          {TURNOS.find((t) => t.value === p.turno)?.label ?? p.turno}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipante(p.key)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded"
                          aria-label="Remover"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showAddPart && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 ring-1 ring-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Usuário cadastrado</label>
                  <select
                    value={partUsuarioId}
                    onChange={(e) => {
                      setPartUsuarioId(e.target.value)
                      if (e.target.value) {
                        const u = usuarios.find((x) => x.id === e.target.value)
                        setPartNome(u?.nome ?? '')
                      }
                    }}
                    className={inputCls}
                  >
                    <option value="">— Selecionar (opcional) —</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nome (se não cadastrado)</label>
                  <input
                    type="text"
                    value={partNome}
                    onChange={(e) => setPartNome(e.target.value)}
                    placeholder="Nome completo"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>
                    <Hash className="h-2.5 w-2.5 inline mr-0.5" /> Matrícula
                  </label>
                  <input
                    type="text"
                    value={partMatricula}
                    onChange={(e) => setPartMatricula(e.target.value)}
                    placeholder="12345"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <Building2 className="h-2.5 w-2.5 inline mr-0.5" /> Setor
                  </label>
                  <input
                    type="text"
                    value={partSetor}
                    onChange={(e) => setPartSetor(e.target.value)}
                    placeholder="Produção"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <Clock className="h-2.5 w-2.5 inline mr-0.5" /> Turno
                  </label>
                  <select
                    value={partTurno}
                    onChange={(e) => setPartTurno(e.target.value as TreinamentoTurno)}
                    className={`${inputCls} cursor-pointer`}
                  >
                    {TURNOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPart(false)
                    setPartUsuarioId('')
                    setPartNome('')
                    setPartMatricula('')
                    setPartSetor('')
                    setPartTurno('manha')
                    setError(null)
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddParticipante}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                >
                  <Check className="h-3 w-3" /> Adicionar
                </button>
              </div>
            </div>
          )}

          {participantes.length === 0 && !showAddPart && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Users className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">Nenhum participante adicionado.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="bg-gradient-to-br from-blue-700 to-blue-600 hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Criar Treinamento
          </button>
        </div>
      </section>

      {/* Sidebar */}
      <aside className="w-72 shrink-0 space-y-5 sticky top-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configurações</h3>

          <div>
            <label className={labelCls}>Área</label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">Selecionar área...</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}{a.unidade ? ` · ${a.unidade.nome}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>
              <Calendar className="h-2.5 w-2.5 inline mr-0.5" /> Validade (meses)
            </label>
            <input
              type="number"
              min={0}
              value={validadeMeses}
              onChange={(e) => setValidadeMeses(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="12"
              className={inputCls}
            />
            <p className="text-[10px] text-slate-400 mt-1">0 = sem validade</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-5 ring-1 ring-blue-200/40">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-700" />
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Dica
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {categoria === 'interno'
              ? 'Treinamentos internos vinculam-se a documentos do SGQ. Quando o documento for atualizado, os participantes serão notificados automaticamente.'
              : 'Treinamentos externos compõem o Plano Anual. Após realizado, registre a avaliação de eficácia para fechar o ciclo.'}
          </p>
        </div>
      </aside>
    </form>
  )
}
