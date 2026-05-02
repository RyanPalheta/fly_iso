import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type ReuniaoRow = {
  id: string
  titulo: string
  data: string
  status: string
  ata: string | null
  participantes: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ChecklistItemRow = {
  id: string
  reuniao_id: string
  item_iso: string
  descricao: string | null
  status: string
  observacoes: string | null
  evidencia: string | null
  ordem: number
  created_at: string
}

export type ReuniaoAcaoRow = {
  id: string
  reuniao_id: string
  descricao: string
  responsavel_id: string | null
  prazo: string | null
  status: string
  capa_id: string | null
  created_at: string
  updated_at: string
}

export type ReuniaoComRelacoes = ReuniaoRow & {
  checklist_items: ChecklistItemRow[]
  reuniao_acoes: Array<ReuniaoAcaoRow & {
    responsavel: { nome: string } | null
  }>
  criador: { nome: string } | null
}

/** Os 12 inputs obrigatórios da cláusula 9.3.2 da ISO 9001:2015 */
export const ISO_INPUTS_9_3_2: Array<{ ordem: number; item_iso: string; descricao: string }> = [
  { ordem: 1,  item_iso: 'Resultados de auditorias anteriores',                  descricao: 'Status das ações decorrentes de auditorias internas e externas anteriores.' },
  { ordem: 2,  item_iso: 'Mudanças em questões externas e internas',              descricao: 'Questões externas/internas relevantes para o SGQ (cláusula 4.1).' },
  { ordem: 3,  item_iso: 'Desempenho e eficácia do SGQ — Não Conformidades',     descricao: 'Tendência de NCs, reclamações de clientes e ações corretivas (8.7, 10.2).' },
  { ordem: 4,  item_iso: 'Desempenho e eficácia do SGQ — Monitoramento e Med.', descricao: 'Resultados de monitoramento, medição, análise e avaliação (9.1).' },
  { ordem: 5,  item_iso: 'Desempenho e eficácia do SGQ — Auditorias Internas',  descricao: 'Resultados das auditorias internas realizadas (9.2).' },
  { ordem: 6,  item_iso: 'Desempenho e eficácia do SGQ — Satisfação de Clientes', descricao: 'Feedback de clientes, reclamações e índices de satisfação.' },
  { ordem: 7,  item_iso: 'Desempenho de provedores externos',                    descricao: 'Desempenho de fornecedores e provedores externos.' },
  { ordem: 8,  item_iso: 'Adequação de recursos',                                descricao: 'Análise da adequação e disponibilidade de recursos.' },
  { ordem: 9,  item_iso: 'Eficácia das ações para tratar riscos e oportunidades', descricao: 'Eficácia das ações tomadas para enfrentar riscos e oportunidades (6.1).' },
  { ordem: 10, item_iso: 'Oportunidades de melhoria',                             descricao: 'Propostas de melhoria contínua do SGQ e dos processos.' },
  { ordem: 11, item_iso: 'Indicadores de desempenho (KPIs)',                     descricao: 'Resultado dos indicadores e KPIs monitorados no período.' },
  { ordem: 12, item_iso: 'Necessidades de mudança no SGQ',                       descricao: 'Necessidades de mudança na política, objetivos, processos ou documentação do SGQ.' },
]

export async function listReunioes(): Promise<ReuniaoRow[]> {
  const sb = await createClient()
  const { data, error } = await (sb as any)
    .from('reunioes')
    .select('*')
    .order('data', { ascending: false })

  if (error) { console.error('listReunioes', error); return [] }
  return (data ?? []) as ReuniaoRow[]
}

export async function getReuniao(id: string): Promise<ReuniaoComRelacoes | null> {
  const sb = await createClient()
  const { data, error } = await (sb as any)
    .from('reunioes')
    .select(`
      *,
      checklist_items ( * ),
      reuniao_acoes (
        *,
        responsavel:usuarios!responsavel_id ( nome )
      ),
      criador:usuarios!created_by ( nome )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as ReuniaoComRelacoes
}

export type ReuniaoStats = {
  total: number
  planejadas: number
  em_andamento: number
  concluidas: number
}

export async function getReuniaoStats(): Promise<ReuniaoStats> {
  const sb = await createClient()
  const { data } = await (sb as any).from('reunioes').select('status')
  const rows = (data ?? []) as Array<{ status: string }>
  return {
    total:        rows.length,
    planejadas:   rows.filter((r) => r.status === 'planejada').length,
    em_andamento: rows.filter((r) => r.status === 'em_andamento').length,
    concluidas:   rows.filter((r) => r.status === 'concluida').length,
  }
}
