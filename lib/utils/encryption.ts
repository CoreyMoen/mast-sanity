import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM.
 * Returns a base64-encoded string containing IV + ciphertext + auth tag.
 */
export function encrypt(plaintext: string, encryptionKey: string): string {
  const key = Buffer.from(encryptionKey, "hex");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  const result = Buffer.concat([iv, encrypted, authTag]);
  return result.toString("base64");
}

/**
 * Decrypts a base64-encoded string that was encrypted with `encrypt()`.
 */
export function decrypt(encryptedBase64: string, encryptionKey: string): string {
  const key = Buffer.from(encryptionKey, "hex");
  const data = Buffer.from(encryptedBase64, "base64");

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(data.length - AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH, data.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}
