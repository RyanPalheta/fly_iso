'use client'

import { useRef, useState } from 'react'
import { FileText, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface FileUploadProps {
  bucket: string
  path: string
  accept?: string
  maxSizeMB?: number
  onUpload: (url: string, fileName: string) => void
  onError?: (msg: string) => void
  label?: string
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export function FileUpload({
  bucket,
  path,
  accept,
  maxSizeMB = 10,
  onUpload,
  onError,
  label = 'Arraste um arquivo ou clique para selecionar',
}: FileUploadProps) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [state, setState]     = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleError(msg: string) {
    setState('error')
    setErrorMsg(msg)
    onError?.(msg)
  }

  /**
   * Sanitiza nome para usar como key do Supabase Storage.
   * Supabase NÃO aceita: espaços, acentos, parênteses, vírgulas, etc.
   * Só permite [a-zA-Z0-9._/-]. Preservamos a extensão.
   * O nome ORIGINAL (com acentos) continua sendo exibido no UI.
   */
  function sanitizeForStorage(name: string): string {
    // Separa nome e extensão
    const lastDot = name.lastIndexOf('.')
    const ext  = lastDot > 0 ? name.slice(lastDot).toLowerCase() : ''
    const base = lastDot > 0 ? name.slice(0, lastDot) : name

    const cleanBase = base
      .normalize('NFD')                  // separa acentos: "ç" → "ç"
      .replace(/[̀-ͯ]/g, '')   // remove diacríticos
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')    // troca tudo não permitido por "-"
      .replace(/^-+|-+$/g, '')           // remove "-" do início/fim
      .replace(/-{2,}/g, '-')            // colapsa múltiplos "-"
      .slice(0, 80)                       // limita tamanho

    return (cleanBase || 'arquivo') + ext
  }

  async function uploadFile(file: File) {
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      handleError(`Arquivo muito grande. Máximo: ${maxSizeMB} MB.`)
      return
    }

    setState('uploading')
    setProgress(0)
    setFileName(file.name)
    setErrorMsg(null)

    const sb          = createClient()
    // Key de storage: sanitizada (sem espaços/acentos). Mantém file.name
    // original para exibir no UI e como "nome" enviado ao callback.
    const safeFileName = sanitizeForStorage(file.name)
    const storagePath  = path + safeFileName

    // Use XMLHttpRequest for upload progress
    const {
      data: { publicUrl },
    } = sb.storage.from(bucket).getPublicUrl(storagePath)

    // Simulate progress while Supabase SDK uploads
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90))
    }, 150)

    const { error } = await sb.storage
      .from(bucket)
      .upload(storagePath, file, { upsert: true })

    clearInterval(progressInterval)

    if (error) {
      handleError(`Erro ao enviar: ${error.message}`)
      return
    }

    setProgress(100)
    setState('success')
    onUpload(publicUrl, file.name)
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    uploadFile(files[0])
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  // Zone classes
  const zoneBase =
    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors'
  const zoneClass =
    state === 'success'
      ? `${zoneBase} border-emerald-300 bg-emerald-50`
      : state === 'error'
      ? `${zoneBase} border-red-300 bg-red-50`
      : dragOver
      ? `${zoneBase} border-blue-500 bg-blue-50`
      : `${zoneBase} border-slate-200 hover:border-blue-400 hover:bg-blue-50/30`

  return (
    <div
      className={zoneClass}
      onClick={() => state !== 'uploading' && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {state === 'idle' && (
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Upload className="w-8 h-8 text-slate-300" />
          <p className="text-sm">{label}</p>
          {accept && (
            <p className="text-xs text-slate-400">
              Tipos aceitos: {accept}
            </p>
          )}
          <p className="text-xs text-slate-400">Máximo: {maxSizeMB} MB</p>
        </div>
      )}

      {state === 'uploading' && (
        <div className="flex flex-col items-center gap-3 text-slate-600">
          {/* Spinner */}
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">{fileName}</p>
          <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">{progress}%</p>
        </div>
      )}

      {state === 'success' && (
        <div className="flex flex-col items-center gap-2 text-emerald-600">
          <CheckCircle className="w-8 h-8" />
          <p className="text-sm font-medium">{fileName}</p>
          <p className="text-xs text-emerald-500">Enviado com sucesso</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setState('idle'); setFileName(null) }}
            className="mt-1 text-xs text-slate-500 underline hover:text-slate-700"
          >
            Enviar outro arquivo
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center gap-2 text-red-600">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-medium">Erro ao enviar</p>
          <p className="text-xs text-red-500">{errorMsg}</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setState('idle'); setErrorMsg(null) }}
            className="mt-1 text-xs text-slate-500 underline hover:text-slate-700"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
