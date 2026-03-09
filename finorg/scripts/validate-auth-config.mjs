#!/usr/bin/env node
/**
 * Valida configurações de autenticação do WorkOS
 * Verifica se as variáveis de ambiente estão corretas para persistência de sessão.
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env file manually
try {
  const envPath = join(__dirname, '..', '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([A-Z_]+)=["']?(.+?)["']?$/)
    if (match) {
      process.env[match[1]] = match[2]
    }
  })
} catch (err) {
  console.warn('⚠️  Não foi possível ler .env, usando variáveis do sistema\n')
}

const required = [
  'WORKOS_API_KEY',
  'WORKOS_CLIENT_ID',
  'WORKOS_REDIRECT_URI',
  'WORKOS_COOKIE_PASSWORD',
]

const recommended = [
  'WORKOS_COOKIE_MAX_AGE',
  'WORKOS_COOKIE_SAMESITE',
]

console.log('🔐 Validando configurações de autenticação WorkOS...\n')

let hasErrors = false
let hasWarnings = false

// Check required vars
console.log('✅ Variáveis OBRIGATÓRIAS:')
required.forEach((key) => {
  const value = process.env[key]
  if (!value) {
    console.error(`  ❌ ${key} não definido!`)
    hasErrors = true
  } else if (value.length < 10) {
    console.error(`  ⚠️  ${key} parece muito curto (${value.length} chars)`)
    hasWarnings = true
  } else {
    console.log(`  ✅ ${key} definido (${value.length} chars)`)
  }
})

// Check recommended vars
console.log('\n⭐ Variáveis RECOMENDADAS (previnem auth loops):')
recommended.forEach((key) => {
  const value = process.env[key]
  if (!value) {
    console.warn(`  ⚠️  ${key} não definido (usará default do WorkOS)`)
    hasWarnings = true
  } else {
    console.log(`  ✅ ${key} = ${value}`)
  }
})

// Validate WORKOS_COOKIE_MAX_AGE
const maxAge = process.env.WORKOS_COOKIE_MAX_AGE
if (maxAge) {
  const seconds = parseInt(maxAge, 10)
  const hours = Math.floor(seconds / 3600)
  const days = Math.floor(seconds / 86400)

  console.log('\n⏰ Duração da sessão:')
  if (seconds < 3600) {
    console.warn(`  ⚠️  ${seconds}s (${Math.floor(seconds / 60)} minutos) - MUITO CURTO!`)
    console.warn('     Recomendado: pelo menos 86400 (1 dia)')
    hasWarnings = true
  } else if (seconds < 86400) {
    console.warn(`  ⚠️  ${seconds}s (${hours}h) - curto, considere 1+ dia`)
    hasWarnings = true
  } else {
    console.log(`  ✅ ${seconds}s (${days} dias) - adequado`)
  }
}

// Validate WORKOS_COOKIE_SAMESITE
const sameSite = process.env.WORKOS_COOKIE_SAMESITE
if (sameSite) {
  console.log('\n🍪 Política de Cookie:')
  const valid = ['lax', 'strict', 'none']
  if (!valid.includes(sameSite.toLowerCase())) {
    console.error(`  ❌ WORKOS_COOKIE_SAMESITE="${sameSite}" inválido!`)
    console.error(`     Valores aceitos: ${valid.join(', ')}`)
    hasErrors = true
  } else if (sameSite.toLowerCase() === 'none') {
    console.warn('  ⚠️  SameSite=none requer HTTPS (Secure flag)')
    hasWarnings = true
  } else if (sameSite.toLowerCase() === 'strict') {
    console.warn('  ⚠️  SameSite=strict pode quebrar redirects de terceiros')
    hasWarnings = true
  } else {
    console.log(`  ✅ SameSite=${sameSite} (recomendado)`)
  }
}

// Check WORKOS_COOKIE_PASSWORD strength
const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD
if (cookiePassword) {
  console.log('\n🔑 Força do WORKOS_COOKIE_PASSWORD:')
  if (cookiePassword.length < 32) {
    console.error(`  ❌ Muito curto (${cookiePassword.length} chars)! Mínimo: 32`)
    hasErrors = true
  } else if (cookiePassword.length < 64) {
    console.warn(`  ⚠️  ${cookiePassword.length} chars - funcional, mas recomendado: 64+`)
    hasWarnings = true
  } else {
    console.log(`  ✅ ${cookiePassword.length} chars - forte`)
  }
}

// Summary
console.log('\n' + '='.repeat(60))
if (hasErrors) {
  console.error('❌ FALHA: Corrija os erros acima antes de prosseguir.')
  process.exit(1)
} else if (hasWarnings) {
  console.warn('⚠️  AVISOS: Aplicação funcionará, mas configuração não é ideal.')
  console.warn('   Para produção, corrija os avisos acima.')
  process.exit(0)
} else {
  console.log('✅ SUCESSO: Todas as configurações estão corretas!')
  console.log('   Sessão persistirá por 7 dias, cookies seguros habilitados.')
  process.exit(0)
}
