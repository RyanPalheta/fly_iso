'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Filter, Plus, ChevronLeft, ChevronRight, ChevronDown,
  FileText, CheckCircle2, Hourglass, FolderOpen, FileType,
  Calendar, MapPin, User, X,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import type { DocumentoComArea } from '@/lib/queries/documentos'
import { cn } from '@/lib/utils'

// DB tipo → label exibido + classe
const TIPO_META: Record<string, { label: string; cls: string }> = {
  Manual:       { label: 'Manual',       cls: 'bg-blue-50 text-blue-600' },
  Procedimento: { label: 'Procedimento', cls: 'bg-slate-100 text-slate-600' },
  Instrucao:    { label: 'Instrução',    cls: 'bg-indigo-50 text-indigo-600' },
  Formulario:   { label: 'Formulário',   cls: 'bg-orange-50 text-orange-600' },
  Politica:     { label: 'Política',     cls: 'bg-purple-50 text-purple-600' },
  Registro:     { label: 'Registro',     cls: 'bg-slate-100 text-slate-600' },
}

const TIPO_OPTIONS = ['Todos', 'Manual', 'Procedimento', 'Instrucao', 'Formulario', 'Politica'] as const
const STATUS_OPTIONS = [
  { value: 'Todos',      label: 'Status' },
  { value: 'vigente',    label: 'Vigente' },
  { value: 'aprovado',   label: 'Aprovado' },
  { value: 'em_revisao', label: 'Em Revisão' },
  { value: 'rascunho',   label: 'Rascunho' },
  { value: 'obsoleto',   label: 'Obsoleto' },
] as const

interface DocumentTableProps {
  documentos: DocumentoComArea[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(nome: string | null | undefined): string {
  if (!nome) return '—'
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

interface FilterSelectProps {
  icon:      React.ElementType
  value:     string
  onChange:  (v: string) => void
  ariaLabel: string
  children:  React.ReactNode
}

function FilterSelect({
  icon: Icon, value, onChange, ariaLabel, children,
}: Readonly<FilterSelectProps>) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg pl-3 pr-9 py-2 shadow-sm transition-colors min-w-[160px]">
        <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
          className="appearance-none bg-transparent text-xs font-semibold text-slate-700 border-none focus:outline-none focus:ring-0 pr-2 cursor-pointer flex-1 truncate"
        >
          {children}
        </select>
      </div>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
    </div>
  )
}

interface InsightCardProps {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  value: number
  sub: string
  valueColor: string
}

function InsightCard({
  icon: Icon, iconBg, iconColor, title, value, sub, valueColor,
}: Readonly<InsightCardProps>) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <p className={cn('text-3xl font-extrabold tabular-nums', valueColor)}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}

export function DocumentTable({ documentos }: Readonly<DocumentTableProps>) {
  const router = useRouter()
  const [search, setSearch]               = useState('')
  const [tipoFilter, setTipoFilter]       = useState('Todos')
  const [statusFilter, setStatusFilter]   = useState('Todos')

  // ── Filtros avançados ──
  const [showAdvanced, setShowAdvanced]   = useState(false)
  const [areaFilter, setAreaFilter]       = useState('Todas')
  const [respFilter, setRespFilter]       = useState('Todos')
  const [dataDe, setDataDe]               = useState('')
  const [dataAte, setDataAte]             = useState('')

  // Opções dinâmicas baseadas nos dados disponíveis
  const areasUnicas = Array.from(new Set(
    documentos.map((d) => d.areas?.nome).filter(Boolean) as string[]
  )).sort()
  const responsaveisUnicos = Array.from(new Set(
    documentos.map((d) => d.responsavel?.nome).filter(Boolean) as string[]
  )).sort()

  const advancedCount =
    (areaFilter !== 'Todas' ? 1 : 0) +
    (respFilter !== 'Todos' ? 1 : 0) +
    (dataDe ? 1 : 0) +
    (dataAte ? 1 : 0)

  const clearAdvanced = () => {
    setAreaFilter('Todas'); setRespFilter('Todos'); setDataDe(''); setDataAte('')
  }

  const filtered = documentos.filter((doc) => {
    const q = search.toLowerCase()
    const areaNome = doc.areas?.nome ?? ''
    const respNome = doc.responsavel?.nome ?? ''

    const matchSearch =
      doc.titulo.toLowerCase().includes(q) ||
      doc.codigo.toLowerCase().includes(q) ||
      areaNome.toLowerCase().includes(q)
    const matchTipo   = tipoFilter   === 'Todos' || doc.tipo   === tipoFilter
    const matchStatus = statusFilter === 'Todos' || doc.status === statusFilter
    const matchArea   = areaFilter   === 'Todas' || areaNome === areaFilter
    const matchResp   = respFilter   === 'Todos' || respNome === respFilter

    // Compara YYYY-MM-DD lexicalmente (campo é timestamp; pegamos só a data)
    const dataDoc = doc.updated_at?.split('T')[0] ?? ''
    const matchDataDe  = !dataDe  || dataDoc >= dataDe
    const matchDataAte = !dataAte || dataDoc <= dataAte

    return matchSearch && matchTipo && matchStatus && matchArea && matchResp && matchDataDe && matchDataAte
  })

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
            Controle de Documentos
          </h1>
          <p className="text-slate-500 text-sm max-w-md">
            Gerencie, acompanhe e audite toda a documentação oficial de qualidade e
            procedimentos operacionais padrão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* Filter bar — selects estilizados como botões consistentes */}
          <div className="flex items-center gap-2">
            <FilterSelect
              icon={FileType}
              value={tipoFilter}
              onChange={setTipoFilter}
              ariaLabel="Filtrar por tipo"
            >
              {TIPO_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t === 'Todos' ? 'Todos os tipos' : (TIPO_META[t]?.label ?? t)}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              icon={CheckCircle2}
              value={statusFilter}
              onChange={setStatusFilter}
              ariaLabel="Filtrar por status"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.value === 'Todos' ? 'Todos os status' : s.label}
                </option>
              ))}
            </FilterSelect>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold border rounded-lg px-3 py-2 transition-colors shadow-sm',
                showAdvanced || advancedCount > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              )}
            >
              <Filter className={cn('h-3.5 w-3.5', advancedCount > 0 ? 'text-blue-600' : 'text-slate-400')} />
              Mais filtros
              {advancedCount > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {advancedCount}
                </span>
              )}
            </button>
          </div>

          {/* New document */}
          <button
            onClick={() => router.push('/documentos/novo')}
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo Documento
          </button>
        </div>
      </div>

      {/* ── Painel de Filtros Avançados (expansível) ── */}
      {showAdvanced && (
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-700">Filtros avançados</h3>
            <div className="flex items-center gap-2">
              {advancedCount > 0 && (
                <button
                  type="button"
                  onClick={clearAdvanced}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Limpar
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAdvanced(false)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Área */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                <MapPin className="h-3 w-3" /> Área
              </label>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-700 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none cursor-pointer"
              >
                <option value="Todas">Todas as áreas</option>
                {areasUnicas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Responsável */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                <User className="h-3 w-3" /> Responsável
              </label>
              <select
                value={respFilter}
                onChange={(e) => setRespFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-700 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none cursor-pointer"
              >
                <option value="Todos">Todos</option>
                {responsaveisUnicos.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Data De */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                <Calendar className="h-3 w-3" /> Atualizado de
              </label>
              <input
                type="date"
                value={dataDe}
                onChange={(e) => setDataDe(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-700 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
            </div>

            {/* Data Até */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                <Calendar className="h-3 w-3" /> Atualizado até
              </label>
              <input
                type="date"
                value={dataAte}
                onChange={(e) => setDataAte(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-700 border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-3">
            Exibindo <strong className="text-slate-700">{filtered.length}</strong> de {documentos.length} documentos.
          </p>
        </div>
      )}

      {/* ── Insight cards (métricas no topo) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <InsightCard
          icon={FolderOpen}
          iconBg="bg-blue-100"
          iconColor="text-blue-700"
          title="Total no Repositório"
          value={documentos.length}
          sub="documentos cadastrados"
          valueColor="text-slate-900"
        />
        <InsightCard
          icon={CheckCircle2}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-700"
          title="Em Conformidade"
          value={documentos.filter((d) => d.status === 'aprovado' || d.status === 'vigente').length}
          sub="aprovados / vigentes"
          valueColor="text-slate-900"
        />
        <InsightCard
          icon={Hourglass}
          iconBg="bg-amber-100"
          iconColor="text-amber-700"
          title="Aguardando Revisão"
          value={documentos.filter((d) => d.status === 'em_revisao').length}
          sub="em aprovação"
          valueColor="text-slate-900"
        />
      </div>

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por código, título ou área..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {[
                  'Código',
                  'Título do Documento',
                  'Tipo',
                  'Versão',
                  'Status',
                  'Área',
                  'Responsável',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right whitespace-nowrap">
                  Última Atualização
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filtered.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => router.push(`/documentos/${doc.id}`)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {/* Código */}
                  <td className="px-6 py-5 text-sm font-mono text-slate-600 whitespace-nowrap">
                    {doc.codigo}
                  </td>

                  {/* Título */}
                  <td className="px-6 py-5 min-w-[220px]">
                    <div className="text-sm font-bold text-slate-900">{doc.titulo}</div>
                    {doc.descricao && (
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{doc.descricao}</div>
                    )}
                  </td>

                  {/* Tipo */}
                  <td className="px-6 py-5">
                    {doc.tipo && (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          TIPO_META[doc.tipo]?.cls ?? 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {TIPO_META[doc.tipo]?.label ?? doc.tipo}
                      </span>
                    )}
                  </td>

                  {/* Versão */}
                  <td className="px-6 py-5 text-sm text-slate-600 whitespace-nowrap">
                    v{doc.revisao_atual}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5">
                    <StatusBadge status={doc.status} />
                  </td>

                  {/* Área */}
                  <td className="px-6 py-5 text-sm text-slate-600 whitespace-nowrap">
                    {doc.areas?.nome ?? '—'}
                  </td>

                  {/* Responsável */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 shrink-0">
                        {initials(doc.responsavel?.nome)}
                      </div>
                      <span className="text-sm text-slate-900 whitespace-nowrap">{doc.responsavel?.nome ?? '—'}</span>
                    </div>
                  </td>

                  {/* Data */}
                  <td className="px-6 py-5 text-sm text-slate-500 text-right whitespace-nowrap">
                    {formatDate(doc.updated_at)}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <p className="text-slate-400 text-sm font-medium">
                      Nenhum documento encontrado.
                    </p>
                    <p className="text-slate-300 text-xs mt-1">
                      Tente ajustar os filtros ou o termo de pesquisa.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Exibindo{' '}
            <span className="font-bold text-slate-900">
              {filtered.length === 0 ? 0 : 1}–{filtered.length}
            </span>{' '}
            de{' '}
            <span className="font-bold text-slate-900">{filtered.length}</span> documentos
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-blue-700 text-blue-700 font-bold text-xs shadow-sm">
              1
            </button>
            <button
              disabled
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
