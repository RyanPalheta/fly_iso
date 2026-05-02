'use client'

import { useTransition, useState } from 'react'
import { CheckCircle2, Clock, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateChecklistItem } from '@/lib/actions/reunioes'
import type { ChecklistItemRow } from '@/lib/queries/reunioes'

interface Props {
  items: ChecklistItemRow[]
  reuniaoId: string
}

const STATUS_META = {
  pendente:       { label: 'Pendente',       cls: 'text-slate-400', icon: Clock,         next: 'abordado' },
  abordado:       { label: 'Abordado',       cls: 'text-emerald-600', icon: CheckCircle2, next: 'nao_aplicavel' },
  nao_aplicavel:  { label: 'N/A',            cls: 'text-slate-400', icon: MinusCircle,   next: 'pendente' },
}

function ChecklistItem({ item, reuniaoId }: Readonly<{ item: ChecklistItemRow; reuniaoId: string }>) {
  const [obs, setObs] = useState(item.observacoes ?? '')
  const [editing, setEditing] = useState(false)
  const [, start] = useTransition()

  const meta = STATUS_META[item.status as keyof typeof STATUS_META] ?? STATUS_META.pendente
  const Icon = meta.icon

  const cycleStatus = () => {
    start(async () => {
      await updateChecklistItem(item.id, reuniaoId, { status: meta.next })
    })
  }

  const saveObs = () => {
    start(async () => {
      await updateChecklistItem(item.id, reuniaoId, { observacoes: obs })
      setEditing(false)
    })
  }

  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 mt-0.5 shrink-0">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">
            {item.ordem}
          </span>
          <button type="button" onClick={cycleStatus} title="Clique para mudar status">
            <Icon className={cn('h-5 w-5 cursor-pointer hover:opacity-70 transition-opacity', meta.cls)} />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{item.item_iso}</p>
          {item.descricao && (
            <p className="text-xs text-slate-500 mt-0.5">{item.descricao}</p>
          )}
          {(editing || obs) && (
            <div className="mt-2">
              {editing ? (
                <div className="space-y-2">
                  <textarea
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    rows={2}
                    placeholder="Observações, evidências, decisões..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={saveObs} className="px-3 py-1 bg-blue-700 text-white text-xs font-bold rounded-lg">Salvar</button>
                    <button type="button" onClick={() => setEditing(false)} className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  </div>
                </div>
              ) : (
                <p
                  className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => setEditing(true)}
                >
                  {obs}
                </p>
              )}
            </div>
          )}
          {!editing && !obs && (
            <button type="button" onClick={() => setEditing(true)} className="mt-1.5 text-[10px] text-blue-700 hover:underline">
              + Adicionar observações
            </button>
          )}
        </div>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider shrink-0', meta.cls)}>
          {meta.label}
        </span>
      </div>
    </div>
  )
}

export function ChecklistEditor({ items, reuniaoId }: Readonly<Props>) {
  const sorted = [...items].sort((a, b) => a.ordem - b.ordem)
  const abordados = sorted.filter((i) => i.status === 'abordado').length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Checklist ISO 9001:2015 — cl. 9.3.2</h2>
          <p className="text-xs text-slate-500 mt-0.5">{abordados}/{sorted.length} inputs abordados</p>
        </div>
        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${sorted.length > 0 ? (abordados / sorted.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((item) => (
          <ChecklistItem key={item.id} item={item} reuniaoId={reuniaoId} />
        ))}
      </div>
    </div>
  )
}
