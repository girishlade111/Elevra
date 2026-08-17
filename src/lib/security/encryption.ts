/**
 * @fileoverview AES-256-GCM encryption utility for storing sensitive credentials.
 *
 * Used exclusively to encrypt/decrypt Gmail App Passwords before writing to
 * or reading from the database. The encryption key is sourced from the
 * ENCRYPTION_KEY environment variable.
 *
 * Ciphertext format: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * @server-only — NEVER import this module from client components or
 *               include its output in API responses.
 *
 * To generate a key:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

// ---------------------------------------------------------------------------
// Key resolution
// ---------------------------------------------------------------------------

function getEncryptionKey(): Buffer {
  const raw = process.env.GMAIL_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;

  if (!raw) {
    throw new Error(
      "[encryption] GMAIL_ENCRYPTION_KEY or ENCRYPTION_KEY environment variable is not set. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" " +
        "and add it to .env"
    );
  }

  if (!/^[0-9a-f]{64}$/i.test(raw)) {
    throw new Error(
      "[encryption] GMAIL_ENCRYPTION_KEY / ENCRYPTION_KEY must be a 64-character lowercase hex string (32 bytes)."
    );
  }

  return Buffer.from(raw, "hex");
}

// ---------------------------------------------------------------------------
// encrypt
// ---------------------------------------------------------------------------

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt (e.g. a Gmail App Password)
 * @returns Ciphertext string in the format "iv:authTag:ciphertext" (all hex-encoded)
 */
export function encryptCredential(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

// ---------------------------------------------------------------------------
// decrypt
// ---------------------------------------------------------------------------

/**
 * Decrypts a ciphertext string produced by `encryptCredential`.
 *
 * @param ciphertext - The "iv:authTag:ciphertext" string from the database
 * @returns The original plaintext string
 * @throws Error if the ciphertext is malformed or the auth tag fails (tampered)
 */
export function decryptCredential(ciphertext: string): string {
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error(
      "[encryption] Invalid ciphertext format. Expected 'iv:authTag:ciphertext'."
    );
  }

  const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string];

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encryptedBuffer = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]).toString("utf8");
}
