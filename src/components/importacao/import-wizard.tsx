'use client'

import { useState, useCallback, useTransition } from 'react'
import { Upload, ArrowRight, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { processarImportacao } from '@/lib/actions/importacao'
import type { ImportacaoResult } from '@/lib/actions/importacao'

// ── Tipos ────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4

interface CsvData {
  headers: string[]
  rows:    Array<Record<string, string>>
  fileName: string
}

// Campos disponíveis por entidade
const CAMPOS_ENTIDADE: Record<string, Array<{ value: string; label: string; required?: boolean }>> = {
  nao_conformidades: [
    { value: 'titulo',    label: 'Título',     required: true },
    { value: 'descricao', label: 'Descrição',  required: true },
    { value: 'severidade', label: 'Severidade (menor/maior/critica)' },
    { value: 'origem',    label: 'Origem' },
    { value: 'status',    label: 'Status' },
  ],
  documentos: [
    { value: 'titulo',    label: 'Título',     required: true },
    { value: 'tipo',      label: 'Tipo',       required: true },
    { value: 'descricao', label: 'Descrição' },
    { value: 'codigo',    label: 'Código' },
  ],
  indicadores: [
    { value: 'nome',           label: 'Nome',  required: true },
    { value: 'meta',           label: 'Meta',  required: true },
    { value: 'descricao',      label: 'Descrição' },
    { value: 'unidade_medida', label: 'Unidade de Medida' },
    { value: 'frequencia',     label: 'Frequência' },
  ],
  treinamentos: [
    { value: 'titulo',    label: 'Título',     required: true },
    { value: 'instrutor', label: 'Instrutor' },
    { value: 'tipo',      label: 'Tipo (presencial/online/leitura)' },
    { value: 'descricao', label: 'Descrição' },
  ],
  registros: [
    { value: 'titulo', label: 'Título', required: true },
    { value: 'tipo',   label: 'Tipo' },
  ],
}

const ENTIDADES_DISPONIVEIS = [
  { value: 'nao_conformidades', label: 'Não Conformidades' },
  { value: 'documentos',        label: 'Documentos' },
  { value: 'indicadores',       label: 'Indicadores' },
  { value: 'treinamentos',      label: 'Treinamentos' },
  { value: 'registros',         label: 'Registros' },
]

// ── Step indicator ────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'Upload' },
    { n: 2, label: 'Mapeamento' },
    { n: 3, label: 'Validação' },
    { n: 4, label: 'Confirmar' },
  ]
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
              current === s.n  && 'bg-blue-700 text-white ring-4 ring-blue-700/20',
              current > s.n    && 'bg-emerald-500 text-white',
              current < s.n    && 'bg-slate-100 text-slate-400'
            )}>
              {current > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
            </div>
            <span className={cn(
              'text-[10px] font-bold mt-1 uppercase tracking-widest',
              current === s.n ? 'text-blue-700' : current > s.n ? 'text-emerald-600' : 'text-slate-400'
            )}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('w-16 h-0.5 mb-5 mx-1', current > s.n ? 'bg-emerald-400' : 'bg-slate-200')} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Upload ────────────────────────────────────────────
function Step1Upload({
  onNext, tipoEntidade, setTipoEntidade,
}: {
  onNext: (csv: CsvData) => void
  tipoEntidade: string
  setTipoEntidade: (v: string) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const parseCsv = (text: string, fileName: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) { setError('Arquivo precisa ter cabeçalho e ao menos 1 linha de dados.'); return }
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
    })
    onNext({ headers, rows, fileName })
  }

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(csv|txt)$/i)) { setError('Apenas arquivos CSV são suportados.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Arquivo muito grande (máx 5 MB).'); return }
    if (!tipoEntidade) { setError('Selecione o tipo de entidade antes de carregar o arquivo.'); return }
    setError('')
    const reader = new FileReader()
    reader.onload = e => parseCsv(e.target?.result as string, file.name)
    reader.readAsText(file, 'UTF-8')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [tipoEntidade]) // eslint-disable-line

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipo de Entidade *</label>
        <select
          value={tipoEntidade}
          onChange={e => setTipoEntidade(e.target.value)}
          className="w-full max-w-xs px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
        >
          <option value="">Selecionar...</option>
          {ENTIDADES_DISPONIVEIS.map(e => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-2xl p-12 text-center transition-all',
          dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300'
        )}
      >
        <FileSpreadsheet className={cn('h-12 w-12 mx-auto mb-4', dragging ? 'text-blue-500' : 'text-slate-300')} />
        <p className="text-sm font-bold text-slate-700 mb-1">Arraste o arquivo CSV aqui</p>
        <p className="text-xs text-slate-400 mb-4">ou clique para selecionar</p>
        <label className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors">
          <Upload className="h-3.5 w-3.5" />
          Selecionar Arquivo
          <input type="file" accept=".csv,.txt" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </label>
        <p className="text-[10px] text-slate-400 mt-3">Máximo 5 MB · Formato CSV com cabeçalho na primeira linha</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Template download hint */}
      <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <p className="font-bold mb-1">💡 Dica: Formato do CSV</p>
        <p>A primeira linha deve ser o cabeçalho com os nomes das colunas. Ex: <code className="bg-amber-100 px-1 rounded">titulo,descricao,severidade,origem</code></p>
      </div>
    </div>
  )
}

// ── Step 2: Mapeamento ────────────────────────────────────────
function Step2Mapping({
  csv, tipoEntidade, mapeamento, setMapeamento, onNext, onBack,
}: {
  csv: CsvData
  tipoEntidade: string
  mapeamento: Record<string, string>
  setMapeamento: (m: Record<string, string>) => void
  onNext: () => void
  onBack: () => void
}) {
  const campos = CAMPOS_ENTIDADE[tipoEntidade] ?? []
  const usedCampos = Object.values(mapeamento).filter(v => v && v !== '__ignorar')
  const requiredMapped = campos.filter(c => c.required).every(c => usedCampos.includes(c.value))

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Mapeie cada coluna do seu CSV para o campo correspondente no sistema.
        <span className="text-red-500 font-bold"> *</span> = obrigatório
      </p>

      <div className="bg-white rounded-2xl ring-1 ring-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Coluna CSV</th>
              <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Exemplo de dados</th>
              <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Campo do sistema</th>
            </tr>
          </thead>
          <tbody>
            {csv.headers.map(col => {
              const exemplo = csv.rows[0]?.[col] ?? ''
              return (
                <tr key={col} className="border-b border-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{col}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">{exemplo || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={mapeamento[col] ?? ''}
                      onChange={e => setMapeamento({ ...mapeamento, [col]: e.target.value })}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white w-full max-w-[220px]"
                    >
                      <option value="">— não importar —</option>
                      <option value="__ignorar">Ignorar</option>
                      {campos.map(c => (
                        <option key={c.value} value={c.value}>
                          {c.label}{c.required ? ' *' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!requiredMapped && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Mapeie todos os campos obrigatórios antes de continuar.
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!requiredMapped}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          Validar Dados <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Validação / Score ─────────────────────────────────
function Step3Validation({
  result, onNext, onBack,
}: {
  result: ImportacaoResult | null
  onNext: () => void
  onBack: () => void
  isLoading: boolean
}) {
  if (!result) return (
    <div className="py-16 text-center">
      <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
      <p className="text-sm font-semibold text-slate-600">Validando dados...</p>
    </div>
  )

  const score = result.scoreQualidade ?? 0
  const scoreColor = score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-red-600'
  const scoreBg    = score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-400' : 'bg-red-500'

  return (
    <div className="space-y-6">
      {/* Score de qualidade */}
      <div className="bg-white rounded-2xl p-6 ring-1 ring-black/5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Score de Qualidade dos Dados</h3>
        <div className="flex items-end gap-6">
          <div>
            <span className={cn('text-6xl font-extrabold', scoreColor)}>{score}</span>
            <span className={cn('text-2xl font-bold', scoreColor)}>/100</span>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className={cn('h-full rounded-full transition-all', scoreBg)} style={{ width: `${score}%` }} />
            </div>
            <p className="text-xs text-slate-500">
              {score >= 90 ? '✅ Excelente qualidade — pronto para importar' :
               score >= 70 ? '⚠️ Qualidade aceitável — alguns campos estão vazios' :
               '❌ Qualidade baixa — revise o arquivo antes de importar'}
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Linhas',    value: result.totalRegistros,     color: 'text-blue-700',    bg: 'bg-blue-50' },
          { label: 'Prontas p/ Importar', value: result.registrosImportados ?? 0, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Com Erro',           value: result.registrosErro ?? 0, color: 'text-red-700',     bg: 'bg-red-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-2xl p-4 text-center', bg)}>
            <div className={cn('text-3xl font-extrabold', color)}>{value}</div>
            <div className="text-xs font-bold text-slate-600 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Log de erros */}
      {(result.logErros?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl ring-1 ring-red-200 overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-bold text-red-700">{result.logErros!.length} erro(s) encontrado(s)</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {result.logErros!.slice(0, 20).map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 text-xs">
                <span className="font-mono text-slate-400 shrink-0">L{e.linha}</span>
                <span className="font-bold text-slate-700 shrink-0">{e.campo}</span>
                <span className="text-red-600">{e.mensagem}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={(result.registrosImportados ?? 0) === 0}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          Confirmar Importação <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Confirm / Result ──────────────────────────────────
function Step4Confirm({ result, onReset }: { result: ImportacaoResult | null; onReset: () => void }) {
  if (!result?.ok) return (
    <div className="py-16 text-center space-y-4">
      <XCircle className="h-16 w-16 text-red-400 mx-auto" />
      <p className="text-lg font-bold text-slate-900">Importação falhou</p>
      <p className="text-sm text-red-600">{result?.error ?? 'Erro desconhecido'}</p>
      <button type="button" onClick={onReset} className="px-5 py-2.5 bg-blue-700 text-white font-bold rounded-xl text-sm">
        Tentar novamente
      </button>
    </div>
  )

  return (
    <div className="space-y-6 text-center">
      <div>
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-extrabold text-slate-900">Importação Concluída!</h3>
        <p className="text-sm text-slate-500 mt-2">Os dados foram importados com sucesso para o sistema.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
        {[
          { label: 'Registros importados', value: result.registrosImportados ?? 0, cls: 'text-emerald-700' },
          { label: 'Registros com erro',   value: result.registrosErro ?? 0,       cls: 'text-red-600' },
          { label: 'Score de qualidade',   value: `${result.scoreQualidade ?? 0}/100`, cls: 'text-blue-700' },
          { label: 'ID da importação',     value: result.id?.slice(0, 8) + '…',    cls: 'font-mono text-slate-500' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={cn('text-lg font-extrabold', cls)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <button type="button" onClick={onReset}
          className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors">
          Nova Importação
        </button>
        <a href="/importacao" className="px-5 py-2.5 bg-blue-700 text-white font-bold rounded-xl text-sm hover:bg-blue-800 transition-colors">
          Ver Histórico
        </a>
      </div>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────
export function ImportWizard() {
  const [step, setStep]                 = useState<Step>(1)
  const [tipoEntidade, setTipoEntidade] = useState('')
  const [csv, setCsv]                   = useState<CsvData | null>(null)
  const [mapeamento, setMapeamento]     = useState<Record<string, string>>({})
  const [validationResult, setValidationResult] = useState<ImportacaoResult | null>(null)
  const [finalResult, setFinalResult]   = useState<ImportacaoResult | null>(null)
  const [isLoading, setIsLoading]       = useState(false)
  const [, startTransition]             = useTransition()

  const reset = () => {
    setStep(1); setCsv(null); setMapeamento({})
    setValidationResult(null); setFinalResult(null)
    setTipoEntidade('')
  }

  // Step 1 → 2: CSV carregado
  const handleUploadDone = (data: CsvData) => {
    setCsv(data)
    // Auto-mapear colunas com nomes iguais aos campos
    const campos = CAMPOS_ENTIDADE[tipoEntidade] ?? []
    const autoMap: Record<string, string> = {}
    data.headers.forEach(col => {
      const match = campos.find(c => c.value.toLowerCase() === col.toLowerCase())
      if (match) autoMap[col] = match.value
    })
    setMapeamento(autoMap)
    setStep(2)
  }

  // Step 2 → 3: Validar
  const handleValidate = () => {
    setStep(3)
    setIsLoading(true)
    setValidationResult(null)
    startTransition(async () => {
      const res = await processarImportacao({
        arquivoNome: csv!.fileName,
        tipoEntidade,
        mapeamento,
        linhas: csv!.rows,
      })
      setValidationResult(res)
      setFinalResult(res)
      setIsLoading(false)
    })
  }

  // Step 3 → 4: Confirmar (importação já foi feita em Step3, apenas avança)
  const handleConfirm = () => setStep(4)

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex justify-center">
        <StepIndicator current={step} />
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5 min-h-[400px]">
        {step === 1 && (
          <Step1Upload
            onNext={handleUploadDone}
            tipoEntidade={tipoEntidade}
            setTipoEntidade={setTipoEntidade}
          />
        )}
        {step === 2 && csv && (
          <Step2Mapping
            csv={csv}
            tipoEntidade={tipoEntidade}
            mapeamento={mapeamento}
            setMapeamento={setMapeamento}
            onNext={handleValidate}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Validation
            result={validationResult}
            onNext={handleConfirm}
            onBack={() => setStep(2)}
            isLoading={isLoading}
          />
        )}
        {step === 4 && (
          <Step4Confirm result={finalResult} onReset={reset} />
        )}
      </div>
    </div>
  )
}
