import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readKeyFromFile } from "./key";

/**
 * Ensures a secret key file exists at the target path.
 * Generates a random 256-bit (32-byte) hex string if missing.
 */
function ensureSecretKeyExists(filePath: string): void {
  const resolvedPath = resolve(filePath);

  if (existsSync(resolvedPath)) {
    return;
  }

  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const hexKey = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  writeFileSync(resolvedPath, hexKey + "\n", "utf-8");
  console.log(`🔑 Generated new secret key file at: ${resolvedPath}`);
}

/**
 * Encrypts a buffer using standard Web Crypto APIs.
 * Prepends the 12-byte random IV to the encrypted file output.
 */
async function encryptFile(
  fileBuffer: ArrayBuffer,
  key: CryptoKey,
): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    fileBuffer,
  );

  const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encryptedBuffer), iv.length);

  return result;
}

/**
 * Detects whether the input is a Web URL or Local File Path and retrieves the ArrayBuffer.
 */
async function fetchFileBuffer(source: string): Promise<ArrayBuffer> {
  const isWebUrl = /^https?:\/\//i.test(source);

  if (isWebUrl) {
    console.log(`[Source Detected: Remote Web URL] Fetching via Web API fetch: ${source}...`);
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote file: ${response.status} ${response.statusText}`);
    }
    return await response.arrayBuffer();
  } else {
    console.log(`[Source Detected: Local File] Reading file path: ${source}...`);
    const nodeBuffer = readFileSync(source);
    // Convert Buffer to ArrayBuffer using standard Web API Uint8Array view
    const uint8Array = new Uint8Array(nodeBuffer);
    return uint8Array.buffer.slice(
      uint8Array.byteOffset,
      uint8Array.byteOffset + uint8Array.byteLength,
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");
  const urlIndex = args.indexOf("--url"); // Maintained for backwards compatibility
  const keyfileIndex = args.indexOf("--keyfile");
  const outIndex = args.indexOf("--out");

  const fileSource = fileIndex !== -1 ? args[fileIndex + 1] : (urlIndex !== -1 ? args[urlIndex + 1] : undefined);
  const keyFilePath = keyfileIndex !== -1 ? args[keyfileIndex + 1] : "./secret.key";
  const outputFile = outIndex !== -1 ? args[outIndex + 1] : "encrypted_file.bin";

  if (!fileSource) {
    console.error("Error: --file (or --url) parameter is required.");
    console.log("Usage: npm run encrypt -- --file <URL_OR_LOCAL_PATH> [--keyfile <KEY_FILE_PATH>] [--out <OUTPUT_FILE>]");
    process.exit(1);
  }

  try {
    console.log(`[1/4] Reading key file: ${keyFilePath}...`);
    ensureSecretKeyExists(keyFilePath);
    const key = await readKeyFromFile(keyFilePath, "encrypt");

    console.log("[2/4] Loading file data...");
    const fileBuffer = await fetchFileBuffer(fileSource);

    console.log("[3/4] Encrypting file using Web Crypto API...");
    const encryptedData = await encryptFile(fileBuffer, key);

    console.log(`[4/4] Writing output to: ${outputFile}...`);
    writeFileSync(outputFile, encryptedData);

    console.log("\n Success!");
    console.log(`Encrypted file saved to: ${outputFile}`);
  } catch (error) {
    console.error("\nAn error occurred:", (error as Error).message);
    process.exit(1);
  }
}

main();
