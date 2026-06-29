/**
 * Script de setup para produção
 * Executa: migrations + criação do super admin
 *
 * Uso: npx tsx scripts/setup-production.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SUPABASE_URL.includes('placeholder')) {
  console.error('❌ Configure as variáveis de ambiente no .env.local primeiro')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function runMigrations() {
  console.log('\n📦 Executando migrations...\n')

  const migrationsDir = path.join(process.cwd(), 'supabase/migrations')
  const files = fs.readdirSync(migrationsDir).sort()

  for (const file of files) {
    console.log(`  ▸ ${file}`)
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')

    const { error } = await supabase.rpc('exec_sql', { sql_text: sql }).single()

    if (error) {
      // RPC might not exist, try direct REST
      console.log(`    ⚠ RPC não disponível. Execute manualmente no SQL Editor do Supabase.`)
      console.log(`    📋 Arquivo: supabase/migrations/${file}`)
    } else {
      console.log(`    ✅ OK`)
    }
  }
}

async function createSuperAdmin() {
  console.log('\n👤 Criando Super Admin...\n')

  const ADMIN_EMAIL = 'admin@cjeexpress.com.br'
  const ADMIN_PASSWORD = 'CjeAdmin@2024'
  const ADMIN_NAME = 'Administrador CJE'
  const ADMIN_PHONE = '(82) 98722-0046'

  // 1. Criar auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('  ⚠ Usuário já existe no Auth. Pulando...')
    } else {
      console.error('  ❌ Erro ao criar auth user:', authError.message)
      return
    }
  } else {
    console.log(`  ✅ Auth user criado: ${ADMIN_EMAIL}`)
  }

  // Buscar o auth user id
  const { data: users } = await supabase.auth.admin.listUsers()
  const adminAuth = users?.users?.find(u => u.email === ADMIN_EMAIL)

  if (!adminAuth) {
    console.error('  ❌ Não encontrou o auth user')
    return
  }

  // 2. Verificar se organização CJE existe
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('type', 'interno')
    .single()

  let orgId: string

  if (existingOrg) {
    orgId = existingOrg.id
    console.log(`  ✅ Organização CJE já existe: ${orgId}`)
  } else {
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'CJE Express',
        corporate_name: 'CJE SERVICOS DE APOIO ADMNISTRATIVO LTDA',
        type: 'interno',
        cnpj_cpf: '54.787.995/0001-01',
        email: 'contato@cjeexpress.com.br',
        phone: '(82) 98722-0046',
        whatsapp: '5582987220046',
        city: 'São Bernardo do Campo',
        state: 'SP',
        zip_code: '09725-000',
        address: 'R Jurubatuba Nº1350',
        status: 'active',
      })
      .select()
      .single()

    if (orgError) {
      console.error('  ❌ Erro ao criar organização:', orgError.message)
      return
    }
    orgId = newOrg.id
    console.log(`  ✅ Organização CJE criada: ${orgId}`)
  }

  // 3. Verificar se profile existe
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', adminAuth.id)
    .single()

  if (existingProfile) {
    console.log(`  ✅ Profile já existe: ${existingProfile.id}`)
  } else {
    const { error: profileError } = await supabase.from('profiles').insert({
      auth_user_id: adminAuth.id,
      organization_id: orgId,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      role: 'SUPER_ADMIN_CJE',
      status: 'active',
    })

    if (profileError) {
      console.error('  ❌ Erro ao criar profile:', profileError.message)
      return
    }
    console.log(`  ✅ Profile criado: ${ADMIN_NAME}`)
  }

  // 4. Criar storage buckets
  console.log('\n📁 Criando storage buckets...\n')

  for (const bucket of ['demand-documents', 'financial-documents']) {
    const { error } = await supabase.storage.createBucket(bucket, { public: true })
    if (error && !error.message.includes('already exists')) {
      console.log(`  ⚠ Bucket ${bucket}: ${error.message}`)
    } else {
      console.log(`  ✅ Bucket: ${bucket}`)
    }
  }

  console.log('\n' + '═'.repeat(50))
  console.log('✅ SETUP CONCLUÍDO!')
  console.log('═'.repeat(50))
  console.log(`\n📧 Email:  ${ADMIN_EMAIL}`)
  console.log(`🔑 Senha:  ${ADMIN_PASSWORD}`)
  console.log(`👤 Role:   SUPER_ADMIN_CJE`)
  console.log(`📱 WhatsApp: (82) 98722-0046`)
  console.log('\n⚠  TROQUE A SENHA APÓS O PRIMEIRO LOGIN!\n')
}

async function main() {
  console.log('═'.repeat(50))
  console.log('  CJE Express Hub — Setup de Produção')
  console.log('═'.repeat(50))
  console.log(`  Supabase: ${SUPABASE_URL}`)

  await createSuperAdmin()
}

main().catch(console.error)
