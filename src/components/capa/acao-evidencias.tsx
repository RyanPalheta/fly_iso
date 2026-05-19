'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, FileImage, FileCode, FileQuestion, X, Save, Loader2,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  addEvidenciaAcao,
  removeEvidenciaAcao,
  updateAcaoObservacao,
} from '@/lib/actions/capa'
import { FileUpload } from '@/components/shared/file-upload'

interface EvidenciaShape { url: string; nome: string }

interface AcaoEvidenciasProps {
  acaoId:        string
  capaId:        string
  evidenciasRaw: unknown
  observacao:    string | null
  readOnly?:     boolean
}

function parseEvidencias(raw: unknown): EvidenciaShape[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (typeof item === 'string') {
      return { url: item, nome: item.split('/').pop() ?? 'arquivo' }
    }
    if (item && typeof item === 'object' && 'url' in item) {
      const o = item as { url?: unknown; nome?: unknown }
      return {
        url:  typeof o.url  === 'string' ? o.url  : '',
        nome: typeof o.nome === 'string' ? o.nome : 'arquivo',
      }
    }
    return { url: '', nome: '' }
  }).filter((e) => e.url)
}

function fileIcon(nome: string) {
  const lower = nome.toLowerCase()
  if (/\.(png|jpe?g|webp|gif|svg)$/.test(lower)) return { Icon: FileImage, cls: 'text-blue-600 bg-blue-50' }
  if (lower.endsWith('.pdf'))                    return { Icon: FileText, cls: 'text-red-600 bg-red-50' }
  if (/\.(xlsx?|csv)$/.test(lower))              return { Icon: FileCode, cls: 'text-emerald-600 bg-emerald-50' }
  if (/\.(docx?|odt)$/.test(lower))              return { Icon: FileText, cls: 'text-slate-600 bg-slate-100' }
  return { Icon: FileQuestion, cls: 'text-slate-500 bg-slate-100' }
}

export function AcaoEvidencias({
  acaoId, capaId, evidenciasRaw, observacao, readOnly,
}: Readonly<AcaoEvidenciasProps>) {
  const router = useRouter()
  const [evidencias, setEvidencias] = useState<EvidenciaShape[]>(parseEvidencias(evidenciasRaw))
  const [obs, setObs] = useState(observacao ?? '')
  const [obsSaved, setObsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sincroniza estado quando props mudam (após router.refresh)
  useEffect(() => { setEvidencias(parseEvidencias(evidenciasRaw)) }, [evidenciasRaw])
  useEffect(() => { setObs(observacao ?? ''); setObsSaved(false) }, [observacao])

  const handleUpload = (url: string, nome: string) => {
    // Optimistic add
    setEvidencias((prev) => [...prev, { url, nome }])
    startTransition(async () => {
      const result = await addEvidenciaAcao({ acaoId, capaId, url, nome })
      if (!result.ok) {
        setError(result.error ?? 'Erro ao salvar evidência.')
        setEvidencias((prev) => prev.filter((e) => e.url !== url))
      } else {
        router.refresh()
      }
    })
  }

  const handleRemove = (idx: number) => {
    const removed = evidencias[idx]
    // Optimistic remove
    setEvidencias((prev) => prev.filter((_, i) => i !== idx))
    startTransition(async () => {
      const result = await removeEvidenciaAcao({ acaoId, capaId, index: idx })
      if (!result.ok) {
        setError(result.error ?? 'Erro ao remover.')
        // Restaura
        setEvidencias((prev) => {
          const next = [...prev]
          next.splice(idx, 0, removed)
          return next
        })
      } else {
        router.refresh()
      }
    })
  }

  const handleSaveObs = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateAcaoObservacao({ acaoId, capaId, observacao: obs })
      if (!result.ok) {
        setError(result.error ?? 'Erro ao salvar observação.')
      } else {
        setObsSaved(true)
        router.refresh()
      }
    })
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
      {/* Lista de evidências */}
      {evidencias.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {evidencias.map((ev, i) => {
            const { Icon, cls } = fileIcon(ev.nome)
            return (
              <li
                key={ev.url + i}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 max-w-xs group transition-all',
                  cls
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold truncate hover:underline"
                  title={ev.nome}
                >
                  {ev.nome}
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
                    className="text-current opacity-50 hover:opacity-100 transition-opacity"
                    aria-label={`Remover ${ev.nome}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Upload */}
      {!readOnly && (
        <div className="border border-dashed border-slate-200 rounded-lg p-2">
          <FileUpload
            bucket="evidencias"
            path={`acao/${acaoId}/`}
            accept="image/*,application/pdf,.xlsx,.xls,.csv,.docx,.doc"
            maxSizeMB={10}
            label="Adicionar evidência (foto, PDF, planilha…)"
            onUpload={handleUpload}
            onError={(msg) => setError(msg)}
          />
        </div>
      )}

      {/* Observação */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
          Observações
        </label>
        {readOnly ? (
          obs ? (
            <p className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
              {obs}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">Sem observações.</p>
          )
        ) : (
          <>
            <textarea
              rows={2}
              value={obs}
              onChange={(e) => { setObs(e.target.value); setObsSaved(false) }}
              placeholder="Anote progresso, dificuldades ou contexto da evidência..."
              className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs border-none focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none placeholder:text-slate-400"
            />
            <div className="flex items-center justify-between mt-1.5">
              {obsSaved && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Observação salva
                </span>
              )}
              {!obsSaved && error && (
                <span className="text-[10px] text-red-600">{error}</span>
              )}
              {!obsSaved && !error && <span />}
              {obs !== (observacao ?? '') && (
                <button
                  type="button"
                  onClick={handleSaveObs}
                  disabled={isPending}
                  className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-1 rounded"
                >
                  {isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />}
                  Salvar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
