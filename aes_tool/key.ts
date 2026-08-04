import { readFileSync } from "node:fs";

/**
 * Converts a hex string to a Uint8Array using standard Web APIs.
 */
export function hexToUint8Array(hexString: string): Uint8Array<ArrayBuffer> {
  const cleanHex = hexString.trim();
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length.");
  }

  const bytes = new Uint8Array(new ArrayBuffer(cleanHex.length / 2));
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Imports a raw 256-bit key using the Web Crypto API.
 */
export async function importKeyFromHex(
  hexKey: string,
  usage: "encrypt" | "decrypt",
): Promise<CryptoKey> {
  const keyBytes = hexToUint8Array(hexKey);

  if (keyBytes.byteLength !== 32) {
    throw new Error(
      `Invalid key length. Expected 32 bytes (256 bits), got ${keyBytes.byteLength} bytes.`,
    );
  }

  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    [usage],
  );
}

/**
 * Reads the 256-bit hex key from a key file.
 * Extracts the first 64-hex-character key, ignoring trailing garbage or
 * accidental extra lines so a corrupted key file still works.
 */
export async function readKeyFromFile(
  keyFilePath: string,
  usage: "encrypt" | "decrypt",
): Promise<CryptoKey> {
  const rawKey = readFileSync(keyFilePath, "utf-8");
  const match = rawKey.match(/[0-9a-fA-F]{64}/);

  if (!match) {
    throw new Error("No 256-bit hex key found in key file.");
  }

  return importKeyFromHex(match[0], usage);
}
