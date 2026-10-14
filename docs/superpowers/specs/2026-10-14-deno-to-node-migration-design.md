# Deno → Node.js migration — design

- **Date:** 2026-10-14
- **Status:** approved (builder check resolved)
- **Repo:** mtcms (React/Vite client + Express/TS server)

## Intent and why

Deno currently supplies the repo's formatting, linting, task running, and the
server's run/test wrapper. The application code is already Node-shaped: the
client is a Vite/npm project, and the server imports `node:http`, uses
`process.env`, and depends only on npm packages (`express`, `pg`, `bcryptjs`,
`ws`). We are standardizing on **Node.js** so the whole repo uses one
toolchain, removing the second runtime and its lockfiles, editor extension, and
duplicated task runner.

The driver is developer/cognitive overhead, not a functional bug: the primary
"deprecated" signal on the developer's machine came from a third-party VS Code
extension, but the decision to consolidate on Node stands on its own. The
migration must be behavior-preserving.

## Goals

1. No `deno` binary required for install, dev, run, test, lint, or format.
2. Formatting output matches the intent of the current `deno.json` `fmt`
   settings (see constraints).
3. Linting approximates the current `deno.json` `lint` posture
   (`recommended` tags minus three rules) using Node-ecosystem tooling.
4. Preserve the developer experience: server dev uses watch + env file.
5. The repo's automation (VS Code task, OpenCode formatter, OpenCode startup
   plugin) drives the Node formatter, not `deno fmt`.
6. Node is the only runtime declared anywhere in the repo.

## Non-goals

- No functional changes to client or server features, routes, or behavior.
- No new automated test coverage; the existing DB-mutating integration tests
  are dropped rather than ported (see Decisions).
- No database dependency for install/check/verification.
- Not touching `server/media/**` legacy content (already excluded from
  tooling).
- Not migrating the client (already npm/Vite/Node).
- Not adopting a monorepo manager (workspaces/turbo); plain npm scripts stay.

## Anti-goals (would make this a failure even if it "works")

- Requiring `deno` anywhere in a documented or scripted path.
- A repo that is not format-stable: e.g. `npm run fmt:check` failing on a clean
  checkout.
- Breaking `npm run dev`, `npm run check`, or server boot.
- Silently reformatting files outside a single, clearly-scoped "normalization"
  step that can be reviewed on its own.
- Leaving stale Deno references (code, docs, settings, or committed artifacts)
  that mislead the next editor.

## Constraints

- **Environment:** Windows, Node **v24.1.0**, npm 10.2.4. Node 24 runs
  TypeScript directly (type-stripping) and supports `--env-file` and `--watch`
  natively — no server build step needed.
- **Server deps:** all npm already (`server/package.json`). Server has no
  `tsconfig.json` today (type checking came from `deno check`).
- **Root `package.json`** scripts are currently broken placeholders
  (`"postinstall": "deno run install"`, `"dev": "deno run dev"`).
- **`deno.json` (root) fmt settings:** `lineWidth 80`, `indentWidth 2`,
  `singleQuote false`, `semiColons true`, `proseWrap "preserve"`.
- **`deno.json` (root) lint:** `tags: ["recommended"]`, excluding
  `no-sloppy-imports`, `no-window`, `no-window-prefix`.
- **Excludes (tooling):** `node_modules`, `dist`, `build`, `.backup`,
  `server/media`, `client/public`.
- **`server/deno.json` tasks:** dev, start, check, test, lint, fmt.
- **Project conventions:** `ai/` holds live instructions only; OpenCode V2
  config in `opencode.jsonc`; a startup-format plugin already exists at
  `.opencode/plugins/deno-fmt.js`.

## Decisions (how the human partner chose)

1. **Stack: Prettier + ESLint (flat config) + native Node.** Chosen over
   Biome.
2. **Full removal** of Deno config, lockfiles, editor extension, and scripts.
3. **Keep the same dev loop** (watch + env file + direct TS execution).
4. **Tests dropped.** The four `Deno.test` cases in `server/main_test.ts` are
   DB-mutating integration smoke tests against `DATABASE_URL`. They are
   deleted (recoverable from git) rather than ported; the migration takes on no
   database dependency. Acceptance is non-destructive.
5. **Dependencies re-resolved.** Deleting `server/deno.lock` drops the exact
   pins; a fresh `npm install` with a newly committed lockfile is accepted as
   equivalent.
6. **Docs kept accurate.** The `ai/rules/*.md` edit-deny rule is adjusted so
   legitimate maintenance (updating the Deno references) can occur, rather than
   leaving those files stale.

### Builder-check calls (settled by the implementer, not the partner)

- **Tooling lives at the repo root.** `prettier`, `eslint`, `@eslint/js`,
  `typescript-eslint`, and `@types/node` are root devDependencies with a real
  root lockfile, because root scripts, the VS Code folder-open task, and the
  OpenCode formatter all invoke them from the repo root. (`server/` keeps its
  runtime deps.)
- **`check` scope mirrors today.** Type-check the server entrypoint
  (`main.ts`) plus its imports, not the whole tree, to keep the diff
  behavior-preserving. Whole-tree checking is a possible follow-up.
- **Stale artifacts deleted:** `server/fmt-check-output.txt`,
  `server/lint-output.txt`.

## The plan in outline

### Formatting: `deno fmt` → Prettier

`.prettierrc.json`, mapping the `deno.json` `fmt` block one-to-one:

| `deno.json` `fmt`     | Prettier option         |
| --------------------- | ----------------------- |
| `lineWidth: 80`       | `printWidth: 80`        |
| `indentWidth: 2`      | `tabWidth: 2`           |
| `singleQuote: false`  | `singleQuote: false`    |
| `semiColons: true`    | `semi: true`            |
| `proseWrap: preserve` | `proseWrap: "preserve"` |

Prettier's other defaults are used as-is (best practice). Note: a handful of
Prettier defaults differ from dprint/deno fmt (`trailingComma`,
`arrowParens`, `quoteProps`), so switching tools produces a **one-time
normalization** across the repo, committed on its own.

`.prettierignore` mirrors the existing excludes plus lockfiles and tool caches:
`node_modules`, `dist`, `build`, `.backup`, `server/media`, `client/public`,
`.fallow`, `.opencode`, `package-lock.json`, `*.lock`.

### Linting: `deno lint` → ESLint flat config + typescript-eslint

Root `eslint.config.mjs` with `@eslint/js` `recommended` and
`typescript-eslint` `recommended`. `deno lint`'s three `exclude` entries mean
those rules are **off**; we simply do not enable equivalents (`no-window` is
already off in ESLint; `no-sloppy-imports` has no direct analogue and is left
to TS/module resolution). Ignores mirror `.prettierignore`.

### Runtime: `import.meta.main` → Node

- `server/main.ts`: drop the `if (import.meta.main)` guard; the module is only
  ever the entrypoint, so it runs at top level.
- `server/main_test.ts`: **deleted** (decision 4). No test scripts remain.

### Tasks: `deno task` → npm scripts

**`server/package.json`**

| Task        | New script                                |
| ----------- | ----------------------------------------- |
| `dev`       | `node --watch --env-file=../.env main.ts` |
| `start`     | `node --env-file=../.env main.ts`         |
| `check`     | `tsc --noEmit`                            |
| `lint`      | `eslint .`                                |
| `fmt`       | `prettier --write .`                      |
| `fmt:check` | `prettier --check .`                      |

Adds server devDeps: `typescript`, `@types/node`. Adds
`server/tsconfig.json` (entrypoint-scoped include).

**Root `package.json`** orchestrates the tree:

| Script                              | New                                                           |
| ----------------------------------- | ------------------------------------------------------------- |
| `dev`                               | run client + server together (see open items)                 |
| `install:client` / `install:server` | `npm --prefix client install` / `npm --prefix server install` |
| `postinstall`                       | install both prefixes                                         |
| `check`                             | client typecheck + server check                               |
| `lint`                              | root `eslint .` (covers client + server)                      |
| `fmt`                               | root `prettier --write .`                                     |
| `fmt:check`                         | root `prettier --check .`                                     |

Root devDeps: `prettier`, `eslint`, `@eslint/js`, `typescript-eslint`,
`typescript`, `@types/node` (plus a `dev` runner — see open items).

### Deletions

`deno.json`, `deno.lock`, `server/deno.json`, `server/deno.lock`,
`server/main_test.ts`, `server/fmt-check-output.txt`,
`server/lint-output.txt`.

### VS Code

- `.vscode/extensions.json`: remove `denoland.vscode-deno`; add
  `esbenp.prettier-vscode` and `dbaeumer.vscode-eslint`.
- `.vscode/settings.json`: remove all `deno.*` keys (including stale
  `deno.enablePaths` for `api/`, `scripts/`, `desktop/`, which do not exist);
  set `editor.defaultFormatter` to Prettier, `editor.formatOnSave: true`.
- `.vscode/tasks.json`: the folder-open task runs `npm run fmt` (Prettier)
  instead of `deno fmt`.

### OpenCode automation

- `opencode.jsonc`: replace the `formatter.deno` entry with a Prettier entry
  (`prettier --write $FILE`, extensions per what Prettier supports); replace
  the `deno fmt *` shell allow with the Prettier command; adjust the
  `ai/rules/*.md` edit rule so the docs update can be made (decision 6).
- `.opencode/plugins/deno-fmt.js` → replaced by a Prettier-based plugin (same
  idempotent, fail-open, subagent-skip design; instruction becomes "run
  `npm run fmt`").

### Documentation

Update `README.md` and any `ai/` references that mention Deno commands
(including `ai/rules/code-guideline.md`). While touching docs, fix the
pre-existing stale `ComponentEvent` in `ai/rules/components.md` (flagged by
code review).

### Verification (non-destructive)

1. `npm install` at root succeeds with no `deno` involved.
2. `npm run check` passes (client typecheck + server check).
3. `npm run fmt:check` passes on a clean checkout.
4. `npm run lint` passes.
5. Server boot smoke test: `npm run dev:server` starts and serves/responds (no
   DB assertions).
6. `rg -i deno` across tracked files returns only intentional mentions
   (`server/media/**` legacy, historical git).

## Files affected

**Delete:** `deno.json`, `deno.lock`, `server/deno.json`, `server/deno.lock`,
`server/main_test.ts`, `server/fmt-check-output.txt`,
`server/lint-output.txt`.

**Add:** `.prettierrc.json`, `.prettierignore`, `eslint.config.mjs`,
`server/tsconfig.json`, root devDependencies + root lockfile.

**Change:** `package.json`, `server/package.json`, `server/main.ts`,
`.vscode/extensions.json`, `.vscode/settings.json`, `.vscode/tasks.json`,
`opencode.jsonc`, `.opencode/plugins/deno-fmt.js` (→ `prettier-fmt.js`),
`README.md`, `ai/**` mentions.

**Normalization commit:** repo-wide Prettier reflow (one commit, reviewed
separately).

## What is left to the builder

- How root `dev` runs two processes (add `concurrently`, or a tiny Node
  launcher script) — the one remaining open item.
- Whether the client adopts the same ESLint/Prettier config or keeps its own.
- Trim of `.prettierignore`/ESLint ignores.
- Disposition of `.github/_workflows/playwright.yml` (inactive underscore dir)
  and whether CI should run the new `fmt:check`/`lint`/`check`.
- Exact Prettier `trailingComma` / `arrowParens` / `quoteProps` handling if we
  want to minimize the one-time reflow (document any deliberate divergence).

## Resolved questions (from the builder check)

1. Root tooling dependency location → **root devDeps + root lockfile** (call).
2. Client in scope for normalization → yes; Prettier covers `client/**`; keep
   client's own `typecheck`.
3. `tsc` scope → **entrypoint-scoped** `include` (call).
4. `ai/rules/*.md` edit-deny → adjust the rule for legitimate maintenance
   (decision 6).
5. Dependency pinning → fresh resolve accepted (decision 5).
6. Stale Deno output files → delete (call).
