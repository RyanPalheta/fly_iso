import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { AuditoriaPergunta, AuditoriaStatus, AuditoriaTipo } from '@/types/database'

// ── Checklists ────────────────────────────────────────────────────────────────
export interface ChecklistRow {
  id:         string
  codigo:     string
  nome:       string
  descricao:  string | null
  tipo:       string | null
  perguntas:  AuditoriaPergunta[]
  ativo:      boolean
  created_at: string
  updated_at: string
}

export async function listChecklists(opts: { somenteAtivos?: boolean } = {}): Promise<ChecklistRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  let q = sb.from('auditoria_checklists').select('*').order('nome')
  if (opts.somenteAtivos) q = q.eq('ativo', true)
  const { data, error } = await q
  if (error) { console.error('[listChecklists]', error.message); return [] }
  return (data ?? []) as ChecklistRow[]
}

export async function getChecklist(id: string): Promise<ChecklistRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  const { data, error } = await sb.from('auditoria_checklists').select('*').eq('id', id).maybeSingle()
  if (error) { console.error('[getChecklist]', error.message); return null }
  return (data as ChecklistRow | null) ?? null
}

// ── Auditorias ────────────────────────────────────────────────────────────────
export interface AuditoriaRow {
  id:               string
  codigo:           string
  titulo:           string
  tipo:             AuditoriaTipo
  escopo:           string | null
  criterios:        string | null
  data_planejada:   string | null
  data_realizada:   string | null
  auditor_lider_id: string | null
  auditores:        string[]
  area_id:          string | null
  unidade_id:       string | null
  checklist_ids:    string[]
  status:           AuditoriaStatus
  resultado_resumo: string | null
  pontuacao_total:  number
  pontuacao_max:    number
  created_by:       string | null
  created_at:       string
  updated_at:       string
  concluida_em:     string | null
}

export interface AuditoriaComRelacoes extends AuditoriaRow {
  area:           { id: string; nome: string } | null
  unidade:        { id: string; nome: string } | null
  auditor_lider:  { id: string; nome: string } | null
  checklists:     ChecklistRow[]
}

export interface RespostaRow {
  id:                 string
  auditoria_id:       string
  checklist_id:       string
  pergunta_id:        string
  pergunta_snapshot:  AuditoriaPergunta | null
  resposta_valor:     string | null
  pontos:             number | null
  observacao:         string | null
  evidencias:         Array<{ url: string; nome: string }>
  nc_id:              string | null
  respondido_por:     string | null
  respondido_em:      string | null
}

export async function listAuditorias(opts: { status?: AuditoriaStatus } = {}): Promise<AuditoriaComRelacoes[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  let q = sb.from('auditorias').select('*').order('data_planejada', { ascending: false })
  if (opts.status) q = q.eq('status', opts.status)
  const { data, error } = await q
  if (error) { console.error('[listAuditorias]', error.message); return [] }
  return enriquecer((data ?? []) as AuditoriaRow[], sb)
}

export async function getAuditoria(id: string): Promise<AuditoriaComRelacoes | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  const { data, error } = await sb.from('auditorias').select('*').eq('id', id).maybeSingle()
  if (error) { console.error('[getAuditoria]', error.message); return null }
  if (!data) return null
  const enriched = await enriquecer([data as AuditoriaRow], sb)
  return enriched[0] ?? null
}

export async function listRespostas(auditoriaId: string): Promise<RespostaRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  const { data, error } = await sb
    .from('auditoria_respostas').select('*').eq('auditoria_id', auditoriaId)
  if (error) { console.error('[listRespostas]', error.message); return [] }
  return (data ?? []) as RespostaRow[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enriquecer(rows: AuditoriaRow[], sb: any): Promise<AuditoriaComRelacoes[]> {
  if (rows.length === 0) return []

  const areaIds      = [...new Set(rows.map((r) => r.area_id).filter(Boolean) as string[])]
  const unidadeIds   = [...new Set(rows.map((r) => r.unidade_id).filter(Boolean) as string[])]
  const liderIds     = [...new Set(rows.map((r) => r.auditor_lider_id).filter(Boolean) as string[])]
  const checklistIds = [...new Set(rows.flatMap((r) => r.checklist_ids ?? []))]

  const [areasRes, unidadesRes, lideresRes, checklistsRes] = await Promise.all([
    areaIds.length      ? sb.from('areas').select('id, nome').in('id', areaIds)              : Promise.resolve({ data: [] }),
    unidadeIds.length   ? sb.from('unidades').select('id, nome').in('id', unidadeIds)        : Promise.resolve({ data: [] }),
    liderIds.length     ? sb.from('usuarios').select('id, nome').in('id', liderIds)          : Promise.resolve({ data: [] }),
    checklistIds.length ? sb.from('auditoria_checklists').select('*').in('id', checklistIds) : Promise.resolve({ data: [] }),
  ])

  const areaMap = new Map<string, { id: string; nome: string }>()
  for (const a of (areasRes.data ?? []) as Array<{ id: string; nome: string }>) areaMap.set(a.id, a)
  const unidadeMap = new Map<string, { id: string; nome: string }>()
  for (const u of (unidadesRes.data ?? []) as Array<{ id: string; nome: string }>) unidadeMap.set(u.id, u)
  const liderMap = new Map<string, { id: string; nome: string }>()
  for (const l of (lideresRes.data ?? []) as Array<{ id: string; nome: string }>) liderMap.set(l.id, l)
  const checkMap = new Map<string, ChecklistRow>()
  for (const c of (checklistsRes.data ?? []) as ChecklistRow[]) checkMap.set(c.id, c)

  return rows.map((r) => ({
    ...r,
    area:           r.area_id          ? (areaMap.get(r.area_id) ?? null)          : null,
    unidade:        r.unidade_id       ? (unidadeMap.get(r.unidade_id) ?? null)    : null,
    auditor_lider:  r.auditor_lider_id ? (liderMap.get(r.auditor_lider_id) ?? null): null,
    checklists:     (r.checklist_ids ?? []).map((cid) => checkMap.get(cid)).filter(Boolean) as ChecklistRow[],
  }))
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export interface AuditoriaStats {
  total:        number
  planejadas:   number
  em_execucao:  number
  concluidas:   number
  nc_geradas:   number
}

export async function getAuditoriaStats(): Promise<AuditoriaStats> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  const [audRes, respRes] = await Promise.all([
    sb.from('auditorias').select('status'),
    sb.from('auditoria_respostas').select('nc_id'),
  ])
  const audRows = (audRes.data ?? []) as Array<{ status: string }>
  const respRows = (respRes.data ?? []) as Array<{ nc_id: string | null }>
  return {
    total:       audRows.length,
    planejadas:  audRows.filter((a) => a.status === 'planejada').length,
    em_execucao: audRows.filter((a) => a.status === 'em_execucao').length,
    concluidas:  audRows.filter((a) => a.status === 'concluida').length,
    nc_geradas:  respRows.filter((r) => r.nc_id).length,
  }
}
