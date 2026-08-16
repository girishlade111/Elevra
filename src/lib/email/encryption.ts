/**
 * @fileoverview Email credential encryption utilities.
 * Wraps AES-256-GCM symmetric encryption for Gmail App Passwords.
 * @server-only
 */
export { encryptCredential, decryptCredential } from "@/lib/security/encryption";
