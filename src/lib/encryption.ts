// ============================================================
// AES-256-GCM Encryption for National ID
// ============================================================

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns format: iv:ciphertext:tag (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

export function encryptWithAAD(plaintext: string, aad: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}:${Buffer.from(aad, 'utf8').toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Expects format: iv:ciphertext:tag (all hex-encoded)
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3 && parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const ciphertext = parts[1];
    const tag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    if (parts.length === 4) {
      decipher.setAAD(Buffer.from(parts[3], 'hex'));
    }

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    throw new Error('فشل في فك تشفير البيانات');
  }
}

/**
 * Returns a masked version of the National ID showing only last 3 digits.
 * Example: "1234567890" → "******890"
 */
export function maskNationalId(nationalId: string): string {
  if (!nationalId || nationalId.length < 3) return '***';
  const last3 = nationalId.slice(-3);
  const masked = '*'.repeat(nationalId.length - 3);
  return `${masked}${last3}`;
}

/**
 * Extracts the last 3 digits from a National ID for storage.
 */
export function getLastThreeDigits(nationalId: string): string {
  if (!nationalId || nationalId.length < 3) return nationalId || '';
  return nationalId.slice(-3);
}
