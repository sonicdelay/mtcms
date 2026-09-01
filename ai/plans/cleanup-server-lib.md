# Plan: Clean up `server/src/lib/`

## Goal

Remove dead code (unused exports/types) and make internally-only helpers non-exported. Ensure all exported functions return promises where appropriate.

---

## Changes by file

### 1. `server/src/lib/types.ts`

**Remove** the following unused interfaces (never imported anywhere):

- `NodeValuesEntry` (lines 1–6)
- `NodeDataItem` (lines 8–18)
- `Article` (lines 39–42)

**Keep:** `Node`, `MiniNode`, `FileItem`

### 2. `server/src/lib/nodes.service.ts`

**Remove** the unused export:

- `getNodesByType` (lines 147–153)

**Keep:** `NotFoundError`, `ListNodesOptions`, `getAllNodes`, `getNodeById`, `addNode`, `updateNode`, `removeNode`, `getChildren`, `getParent`, `getBreadcrumb`, `getUserByEmail`

### 3. `server/src/lib/articles.service.ts`

**Remove** unused export:

- `getArticleTitle` (lines 136–142)

**Make non-exported** (only used internally):

- `listArticleDir` → `listArticleDir` (only called by `listArticleDirWithTitles`)
- `ARTICLES_ROOT` → `ARTICLES_ROOT` (only used by `resolveArticlesPath`)
- `isValidSegment` → `isValidSegment` (only used by `resolveArticlePath`)
- `extractTitle` → `extractTitle` (only used by `listArticleDirWithTitles`)
- `stripMarkdown` already non-exported — no change

**Keep exported:** `ArticlesError`, `ArticleItem`, `resolveArticlesPath`, `listArticleDirWithTitles`, `getArticleContent`, `resolveArticlePath`

### 4. `server/src/lib/fm.service.ts`

**Remove** unused export:

- `readMediaText` (lines 56–58)

**Make non-exported:**

- `toFileItem` → `toFileItem` (only used by `getFolderContent`)

**Keep exported:** `MEDIA_ROOT`, `MediaError`, `resolveMediaPath`, `getFolderContent`, `statMediaPath`, `readMediaFile`, `writeMediaFile`, `createMediaDirectory`, `removeMediaPath`

### 5. `server/src/lib/auth.ts`

**No changes** — all exports (`AuthUser`, `AuthenticatedRequest`, `signToken`, `verifyToken`, `authRequired`) are consumed.

### 6. `server/src/lib/auth.service.ts`

**No changes** — all exports (`AuthError`, `authenticate`, `login`, `refresh`) are consumed (or `authenticate` is the public API even though only `login`/`refresh` are used externally).

### 7. `server/src/lib/http.ts`

**No changes** — `problem` is consumed everywhere.

### 8. `server/src/lib/db.ts`

**No changes** — pool is consumed by `nodes.service.ts` and `main_test.ts`.

---

## Verification

1. Run `deno task check` from `server/` to confirm no type errors
2. Run `deno task test` to confirm integration tests pass
