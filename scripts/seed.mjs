import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
const env = readFileSync(envPath, 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim()
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
if (!url || !key) { console.error('Missing env vars'); process.exit(1) }

const sb = createClient(url, key, { auth: { persistSession: false } })

const SEED_EMAIL = 'ryanpalhetaorigin@gmail.com'
const SEED_PASSWORD = 'Joker100'
const SEED_NOME = 'Ryan Palheta'

const log = (msg, data) => console.log(`\n▶ ${msg}`, data ?? '')
const die = (where, err) => { console.error(`❌ ${where}:`, err.message ?? err); process.exit(1) }

// ── 1. Auth user ──────────────────────────────────────────────
log('1. Criando/buscando auth user')
let authUserId
const { data: existing } = await sb.auth.admin.listUsers()
const found = existing?.users.find(u => u.email === SEED_EMAIL)
if (found) {
  authUserId = found.id
  console.log(`  ✓ já existe: ${authUserId}`)
} else {
  const { data, error } = await sb.auth.admin.createUser({
    email: SEED_EMAIL, password: SEED_PASSWORD, email_confirm: true,
  })
  if (error) die('createUser', error)
  authUserId = data.user.id
  console.log(`  ✓ criado: ${authUserId}`)
}

// ── 2. Perfis (já seedados) — pegar IDs ─────────────────────
log('2. Buscando perfis')
const { data: perfis, error: perfisErr } = await sb.from('perfis').select('id, nome')
if (perfisErr) die('perfis', perfisErr)
const perfilByNome = Object.fromEntries(perfis.map(p => [p.nome, p.id]))
console.log('  ✓', Object.keys(perfilByNome).join(', '))

// ── 3. Unidades ──────────────────────────────────────────────
log('3. Seed unidades')
const unidadesData = [
  { nome: 'Unidade A — Manufatura', codigo: 'UA-MFG' },
  { nome: 'Unidade B — Lab de Qualidade', codigo: 'UB-LAB' },
]
const { data: existingUnidades } = await sb.from('unidades').select('*').in('codigo', ['UA-MFG', 'UB-LAB'])
let unidades = existingUnidades ?? []
const missing = unidadesData.filter(u => !unidades.some(e => e.codigo === u.codigo))
if (missing.length) {
  const { data: inserted, error: uErr } = await sb.from('unidades').insert(missing).select()
  if (uErr) die('unidades', uErr)
  unidades = [...unidades, ...inserted]
}
const unidadeA = unidades.find(u => u.codigo === 'UA-MFG').id
const unidadeB = unidades.find(u => u.codigo === 'UB-LAB').id
console.log(`  ✓ ${unidades.length} unidades`)

// ── 4. Áreas ─────────────────────────────────────────────────
log('4. Seed áreas')
const areasData = [
  { nome: 'Gestão da Qualidade', unidade_id: unidadeA },
  { nome: 'Operações', unidade_id: unidadeA },
  { nome: 'P&D', unidade_id: unidadeB },
  { nome: 'EHS', unidade_id: unidadeB },
]
// Limpa áreas existentes dessas unidades p/ idempotência simples
await sb.from('areas').delete().in('unidade_id', [unidadeA, unidadeB])
const { data: areas, error: aErr } = await sb.from('areas').insert(areasData).select()
if (aErr) die('areas', aErr)
const areaByNome = Object.fromEntries(areas.map(a => [a.nome, a.id]))
console.log(`  ✓ ${areas.length} áreas`)

// ── 5. Usuário na public.usuarios ──────────────────────────
log('5. Seed public.usuarios')
const { error: userErr } = await sb.from('usuarios').upsert({
  id: authUserId,
  nome: SEED_NOME,
  email: SEED_EMAIL,
  perfil_id: perfilByNome['Qualidade'],
  ativo: true,
}, { onConflict: 'id' })
if (userErr) die('usuarios', userErr)
console.log(`  ✓ vinculado ao perfil Qualidade`)

// ── 6. usuario_unidades ────────────────────────────────────
log('6. Seed usuario_unidades')
await sb.from('usuario_unidades').delete().eq('usuario_id', authUserId)
const { error: uuErr } = await sb.from('usuario_unidades').insert([
  { usuario_id: authUserId, unidade_id: unidadeA },
  { usuario_id: authUserId, unidade_id: unidadeB },
])
if (uuErr) die('usuario_unidades', uuErr)
console.log(`  ✓ vinculado a 2 unidades`)

// ── 7. Documentos ──────────────────────────────────────────
log('7. Seed documentos')
const documentosData = [
  { codigo: 'DOC-001', titulo: 'Manual da Qualidade', tipo: 'Manual',
    area_id: areaByNome['Gestão da Qualidade'], responsavel_id: authUserId,
    status: 'aprovado', revisao_atual: 3,
    descricao: 'Documento mestre do Sistema de Gestão da Qualidade.' },
  { codigo: 'SOP-204', titulo: 'Procedimento de Controle de Documentos', tipo: 'Procedimento',
    area_id: areaByNome['Gestão da Qualidade'], responsavel_id: authUserId,
    status: 'aprovado', revisao_atual: 2,
    descricao: 'Define o fluxo de criação, revisão e aprovação de documentos.' },
  { codigo: 'WI-089', titulo: 'Instrução de Calibração de Sensores', tipo: 'Instrucao',
    area_id: areaByNome['Operações'], responsavel_id: authUserId,
    status: 'em_revisao', revisao_atual: 1,
    descricao: 'Procedimento passo-a-passo para calibração de sensores T5.' },
  { codigo: 'FRM-012', titulo: 'Formulário de Abertura de NC', tipo: 'Formulario',
    area_id: areaByNome['Gestão da Qualidade'], responsavel_id: authUserId,
    status: 'aprovado', revisao_atual: 4,
    descricao: 'Template padrão para registro de não conformidades.' },
  { codigo: 'POL-005', titulo: 'Política de Melhoria Contínua', tipo: 'Politica',
    area_id: areaByNome['Gestão da Qualidade'], responsavel_id: authUserId,
    status: 'aprovado', revisao_atual: 1,
    descricao: 'Diretrizes organizacionais para melhoria contínua do SGQ.' },
]
const { data: documentos, error: dErr } = await sb
  .from('documentos').upsert(documentosData, { onConflict: 'codigo' }).select()
if (dErr) die('documentos', dErr)
console.log(`  ✓ ${documentos.length} documentos`)

// ── 8. Não conformidades ───────────────────────────────────
log('8. Seed nao_conformidades')
const ncData = [
  { codigo: 'NC-102', titulo: 'Falha em sensor de temperatura T5-09',
    descricao: 'Sensor falhou ao disparar alerta durante carregamento do E-402.',
    area_id: areaByNome['Operações'], detectado_por: authUserId, responsavel_id: authUserId,
    severidade: 'maior', origem: 'auditoria_interna', status: 'em_analise',
    requisito_violado: 'ISO 9001:2015 — Cláusula 9.1.1' },
  { codigo: 'NC-105', titulo: 'Desvio de rotulagem em lote 20240412',
    descricao: 'Rótulos fora do padrão identificados em amostragem.',
    area_id: areaByNome['Operações'], detectado_por: authUserId, responsavel_id: authUserId,
    severidade: 'menor', origem: 'processo', status: 'encerrada',
    requisito_violado: 'ISO 9001:2015 — Cláusula 8.5.2' },
  { codigo: 'NC-098', titulo: 'Reclamação crítica de cliente — embalagem',
    descricao: 'Cliente reportou falha de vedação em 3% dos lotes.',
    area_id: areaByNome['Operações'], detectado_por: authUserId, responsavel_id: authUserId,
    severidade: 'critica', origem: 'cliente', status: 'em_acao',
    requisito_violado: 'ISO 9001:2015 — Cláusula 8.7' },
  { codigo: 'NC-109', titulo: 'Fornecedor de insumos fora de especificação',
    descricao: 'Lote recebido apresentou pH fora da faixa aceitável.',
    area_id: areaByNome['P&D'], detectado_por: authUserId, responsavel_id: authUserId,
    severidade: 'maior', origem: 'processo', status: 'registrada',
    requisito_violado: 'ISO 9001:2015 — Cláusula 8.4' },
  { codigo: 'NC-111', titulo: 'Treinamento não registrado no sistema',
    descricao: '5 colaboradores sem evidência de aceite digital.',
    area_id: areaByNome['EHS'], detectado_por: authUserId, responsavel_id: authUserId,
    severidade: 'menor', origem: 'auditoria_interna', status: 'em_analise',
    requisito_violado: 'ISO 9001:2015 — Cláusula 7.2' },
]
const { data: ncs, error: ncErr } = await sb
  .from('nao_conformidades').upsert(ncData, { onConflict: 'codigo' }).select()
if (ncErr) die('nao_conformidades', ncErr)
console.log(`  ✓ ${ncs.length} NCs`)

console.log('\n✅ Seed completo!')
console.log(`   Login: ${SEED_EMAIL} / ${SEED_PASSWORD}`)
