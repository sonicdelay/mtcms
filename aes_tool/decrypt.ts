import { readFileSync, writeFileSync } from "node:fs";
import { readKeyFromFile } from "./key";

/**
 * Decrypts an encrypted file buffer using standard Web Crypto APIs.
 * Splits the input into the 12-byte IV and ciphertext + auth tag.
 */
async function decryptFile(
  encryptedData: Uint8Array,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  if (encryptedData.byteLength < 12) {
    throw new Error("Invalid encrypted file format: file is too small to contain an IV.");
  }

  // Extract the 12-byte IV prepended during encryption
  const iv = encryptedData.slice(0, 12);
  const ciphertext = encryptedData.slice(12);

  // Web Crypto API: crypto.subtle.decrypt
  return await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");
  const keyfileIndex = args.indexOf("--keyfile");
  const outIndex = args.indexOf("--out");

  const inputFile = fileIndex !== -1 ? args[fileIndex + 1] : undefined;
  const keyFilePath = keyfileIndex !== -1 ? args[keyfileIndex + 1] : "./secret.key";
  const outputFile = outIndex !== -1 ? args[outIndex + 1] : "restored_file.pdf";

  if (!inputFile) {
    console.error("Error: --file parameter is required.");
    console.log("Usage: npm run decrypt -- --file <ENCRYPTED_FILE> [--keyfile <KEY_FILE_PATH>] [--out <OUTPUT_FILE>]");
    process.exit(1);
  }

  try {
    console.log(`[1/4] Reading key file: ${keyFilePath}...`);
    const key = await readKeyFromFile(keyFilePath, "decrypt");

    console.log(`[2/4] Reading encrypted file: ${inputFile}...`);
    const encryptedBuffer = readFileSync(inputFile);
    const encryptedData = new Uint8Array(encryptedBuffer);

    console.log("[3/4] Decrypting file using Web Crypto API...");
    const decryptedBuffer = await decryptFile(encryptedData, key);

    console.log(`[4/4] Writing restored output to: ${outputFile}...`);
    writeFileSync(outputFile, new Uint8Array(decryptedBuffer));

    console.log("\n Success!");
    console.log(`Decrypted file restored to: ${outputFile}`);
  } catch (error) {
    console.error("\nDecryption failed:", (error as Error).message);
    console.error("Make sure you are using the exact same secret key that was used to encrypt the file.");
    process.exit(1);
  }
}

main();
