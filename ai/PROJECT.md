# Vault

Encrypted file-storage server using Express 5, Deno, TypeScript, and React SSR.

## Standards

- Use TypeScript and ES modules; keep explicit `.ts`/`.tsx` import extensions.
- Use `.tsx` for React server-rendered views and `.ts` for server code.
- Use Deno commands and existing dependencies; do not introduce Node-specific tooling.
- Keep changes focused and preserve the middleware order and public API.

## Commands

- `deno task dev` runs the server in watch mode.
- `deno run --allow-all main.ts` runs the server on port 4000; `PORT` overrides the port.
- `deno check --config deno.json main.ts main_test.ts` type-checks the main entry points.
- `deno test --allow-all` runs the integration suite against temporary directories.

## Architecture

- `main.ts` creates the Express app and starts listening only when `import.meta.main` is true. Tests import `createApp()` and bind an ephemeral port.
- Middleware order is load-bearing: `/api` and `/files` routers, static serving, URL-encoded parsing, static-tree POST actions, static serving again, then directory listings. Keep API routers before static serving.
- `controllers/files.ts` stores encrypted files under `<staticDir>/vault`. Files are addressed by the SHA-256 of their plaintext and stored in four-character directory chunks. Each blob has a plaintext `.meta.json` sibling containing name, type, and size.
- `middleware/vaultKey.ts` selects a non-empty `x-vault-key` header; otherwise it uses the current in-memory server key. The key is never persisted to disk.
- `middleware/directoryActions.ts` handles static-tree uploads, folder creation, deletion, key updates, and optional content-hash storage. `middleware/directoryListing.ts` renders directory pages.
- `lib/vault.ts` derives AES-GCM keys by SHA-256 hashing the key string. Encrypted blobs contain a 12-byte IV followed by ciphertext and the GCM tag.
- `views/index.tsx` and `views/apiDocs.tsx` render HTML with React SSR. `views/index.script.ts` is plain client JavaScript embedded in a template literal; escape backticks and `${` when editing it.

## Invariants

- The default static directory is `media/`; it is gitignored.
- The default encryption key is in memory only. A `key` form field updates it for the current process; a non-empty `x-vault-key` header overrides it for that request.
- Identical plaintext uploaded with different keys shares a content-addressed path, so the later upload replaces the earlier ciphertext.
- A wrong key causes `GET /files/:hash` to return `401`.