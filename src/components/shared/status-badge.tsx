import { cn } from '@/lib/utils'

type Status =
  | 'aprovado' | 'concluido' | 'concluida' | 'eficaz' | 'ativo' | 'vigente'
  | 'em_aprovacao' | 'em_revisao' | 'em_analise' | 'em_andamento' | 'em_investigacao' | 'em_execucao'
  | 'rascunho' | 'pendente' | 'planejado' | 'aberta' | 'registrada'
  | 'obsoleto' | 'cancelado' | 'cancelada' | 'inativo'
  | 'encerrada' | 'encerrado' | 'fechado' | 'investigando' | 'vinculado_capa'
  | 'atrasada' | 'reaberta' | 'plano_definido' | 'verificacao'
  | 'menor' | 'maior' | 'critica'
  | 'corretiva' | 'preventiva'

interface StatusBadgeProps {
  status: Status | string
  className?: string
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  aprovado:         { label: 'Aprovado',         className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  vigente:          { label: 'Vigente',          className: 'bg-emerald-100 text-emerald-800 ring-emerald-300 font-extrabold' },
  concluido:        { label: 'Concluído',        className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  concluida:        { label: 'Concluída',        className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  eficaz:           { label: 'Eficaz',           className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  ativo:            { label: 'Ativo',            className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  encerrada:        { label: 'Encerrada',        className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  encerrado:        { label: 'Encerrado',        className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  em_aprovacao:     { label: 'Em Aprovação',     className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  em_revisao:       { label: 'Em Revisão',       className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  em_analise:       { label: 'Em Análise',       className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  em_andamento:     { label: 'Em Andamento',     className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  em_execucao:      { label: 'Em Execução',      className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  em_investigacao:  { label: 'Em Investigação',  className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  investigando:     { label: 'Investigando',     className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  verificacao:      { label: 'Verificação',      className: 'bg-violet-50 text-violet-700 ring-violet-200' },
  plano_definido:   { label: 'Plano Definido',   className: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  fechado:          { label: 'Fechado',          className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  vinculado_capa:   { label: 'Vinculado ao CAPA',className: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  pendente:         { label: 'Pendente',         className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  planejado:        { label: 'Planejado',        className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  atrasada:         { label: 'Atrasada',         className: 'bg-red-50 text-red-700 ring-red-300 font-extrabold' },
  reaberta:         { label: 'Reaberta',         className: 'bg-rose-50 text-rose-700 ring-rose-200' },
  rascunho:         { label: 'Rascunho',         className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  aberta:           { label: 'Aberta',           className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  registrada:       { label: 'Registrada',       className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  obsoleto:         { label: 'Obsoleto',         className: 'bg-gray-100 text-gray-500 ring-gray-200' },
  cancelado:        { label: 'Cancelado',        className: 'bg-gray-100 text-gray-500 ring-gray-200' },
  cancelada:        { label: 'Cancelada',        className: 'bg-gray-100 text-gray-500 ring-gray-200' },
  inativo:          { label: 'Inativo',          className: 'bg-gray-100 text-gray-500 ring-gray-200' },
  menor:            { label: 'Menor',            className: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
  maior:            { label: 'Maior',            className: 'bg-orange-50 text-orange-700 ring-orange-200' },
  critica:          { label: 'Crítica',          className: 'bg-red-50 text-red-700 ring-red-200' },
  corretiva:        { label: 'Corretiva',        className: 'bg-orange-50 text-orange-700 ring-orange-200' },
  preventiva:       { label: 'Preventiva',       className: 'bg-violet-50 text-violet-700 ring-violet-200' },
}

export function StatusBadge({ status, className }: Readonly<StatusBadgeProps>) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
