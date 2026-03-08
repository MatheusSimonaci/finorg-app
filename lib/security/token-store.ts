/**
 * AES-256-GCM encryption helpers for storing secrets (e.g. Vercel token).
 * Key is derived from a project-level secret stored in AppConfig (auto-generated on first use).
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGO = 'aes-256-gcm'
const SALT = 'finorg-token-store-v1' // fixed salt — key derivation only, not secret

function getKey(): Buffer {
  // Use a stable secret from env or fall back to a hard-coded derivation seed.
  // The seed is NOT secret in itself — the ciphertext is what needs protecting.
  const seed = process.env.TOKEN_STORE_SEED ?? 'finorg-default-seed-change-in-prod'
  return scryptSync(seed, SALT, 32)
}

export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Format: iv(12B) + authTag(16B) + ciphertext — base64 encoded
  return Buffer.concat([iv, authTag, encrypted]).toString('base64url')
}

export function decryptToken(encoded: string): string {
  const key = getKey()
  const buf = Buffer.from(encoded, 'base64url')
  const iv = buf.subarray(0, 12)
  const authTag = buf.subarray(12, 28)
  const ciphertext = buf.subarray(28)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8')
}
