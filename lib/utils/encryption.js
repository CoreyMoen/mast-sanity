"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
var crypto_1 = require("crypto");
var ALGORITHM = "aes-256-gcm";
var IV_LENGTH = 16;
var AUTH_TAG_LENGTH = 16;
/**
 * Encrypts a string using AES-256-GCM.
 * Returns a base64-encoded string containing IV + ciphertext + auth tag.
 */
function encrypt(plaintext, encryptionKey) {
    var key = Buffer.from(encryptionKey, "hex");
    var iv = (0, crypto_1.randomBytes)(IV_LENGTH);
    var cipher = (0, crypto_1.createCipheriv)(ALGORITHM, key, iv);
    var encrypted = cipher.update(plaintext, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    var authTag = cipher.getAuthTag();
    var result = Buffer.concat([iv, encrypted, authTag]);
    return result.toString("base64");
}
/**
 * Decrypts a base64-encoded string that was encrypted with `encrypt()`.
 */
function decrypt(encryptedBase64, encryptionKey) {
    var key = Buffer.from(encryptionKey, "hex");
    var data = Buffer.from(encryptedBase64, "base64");
    var iv = data.subarray(0, IV_LENGTH);
    var authTag = data.subarray(data.length - AUTH_TAG_LENGTH);
    var ciphertext = data.subarray(IV_LENGTH, data.length - AUTH_TAG_LENGTH);
    var decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    var decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
}
