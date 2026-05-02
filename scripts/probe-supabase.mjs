import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
const env = readFileSync(envPath, 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim()
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()

if (!url || !key) {
  console.error('Missing env vars')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { persistSession: false } })

const tables = [
  'unidades', 'areas', 'perfis', 'usuarios', 'usuario_unidades',
  'documentos', 'versoes', 'distribuicao',
  'nao_conformidades', 'capas', 'acoes',
  'indicadores', 'reunioes', 'registros', 'audit_log',
]

console.log('═══ TABELAS ═══')
for (const t of tables) {
  const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true })
  console.log(`${t.padEnd(22)} → ${error ? '❌ ' + error.message : `${count} rows`}`)
}

console.log('\n═══ AUTH USERS ═══')
const { data: users, error: ue } = await sb.auth.admin.listUsers()
if (ue) console.log('❌ ' + ue.message)
else {
  console.log(`Total: ${users.users.length}`)
  for (const u of users.users) console.log(`  • ${u.email?.padEnd(35)} (${u.id})`)
}

console.log('\n═══ PERFIS SEED ═══')
const { data: perfis } = await sb.from('perfis').select('nome, descricao').limit(10)
for (const p of perfis ?? []) console.log(`  • ${p.nome.padEnd(20)} ${p.descricao ?? ''}`)
