/**
 * API Key Encryption Utility
 * Uses AES-256-GCM for secure storage of provider API keys
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get encryption key from environment
 * Must be exactly 32 bytes (256 bits)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_KEY
  
  if (!key) {
    throw new Error('API_KEY_ENCRYPTION_KEY not configured in environment')
  }
  
  // If key is hex string, convert to buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }
  
  // If key is base64, convert to buffer
  if (key.length === 44) {
    return Buffer.from(key, 'base64')
  }
  
  // If raw string, ensure it's 32 bytes
  if (key.length === 32) {
    return Buffer.from(key, 'utf8')
  }
  
  throw new Error('API_KEY_ENCRYPTION_KEY must be 32 bytes (64 hex chars, 44 base64 chars, or 32 raw chars)')
}

/**
 * Encrypt an API key for secure storage
 * Returns format: iv:authTag:encryptedData (all hex encoded)
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key cannot be empty')
  }
  
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Return as iv:authTag:encrypted (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt an API key from secure storage
 * Input format: iv:authTag:encryptedData (all hex encoded)
 */
export function decryptApiKey(encrypted: string): string {
  if (!encrypted) {
    throw new Error('Encrypted data cannot be empty')
  }
  
  const parts = encrypted.split(':')
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format. Expected iv:authTag:encrypted')
  }
  
  const [ivHex, authTagHex, encryptedData] = parts
  
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length')
  }
  
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length')
  }
  
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  try {
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    throw new Error('Decryption failed - data may be corrupted or key mismatch')
  }
}

/**
 * Verify if an encryption key is properly configured
 */
export function isEncryptionKeyConfigured(): boolean {
  try {
    getEncryptionKey()
    return true
  } catch {
    return false
  }
}

/**
 * Generate a new encryption key (for setup purposes)
 * Returns 32-byte hex string
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex')
}