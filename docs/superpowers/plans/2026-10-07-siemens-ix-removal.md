# Siemens iX Removal + Sd* Component Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all `@siemens/*` packages and replace every iX usage in the client with own components that conform to `ai/rules/components.md`.

**Architecture:** Build a registered Sd* component library (form controls, layout/feedback, app shell) styled with Tailwind + `dark:` variants, rewrite the 11 iX-consuming files on top of it, localize the edit-store tree types, and delete the iX CSS. New components follow the existing contract: extend `ComponentProps`, `[key: string]: unknown`, emit via `onChange`, receive via `eventIn`, compose existing DOM handlers first (rules §4).

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, zustand. No new dependencies.

**Spec:** The design approved in session (component inventory, Approach A).

**Verification commands** (all from `client/`): `npm run check:components`, `npm run typecheck`, `npm run lint`, `npm run build`. There is no client test runner — these four are the gates.

## Global Constraints

- Zero iX references after completion: `@siemens`, `Ix*`, `ix-textarea`, `ix-admin`, `siemens-ix` return no matches in `client/src` (grep is the final gate).
- Every `src/components/Sd*.tsx` must pass `npm run check:components` (extends `ComponentProps`, wildcard `[key: string]: unknown`, no `data` prop).
- No commits (per AGENTS.md, only on explicit request). No new npm dependencies. Explicit `.ts`/`.tsx` import extensions everywhere.
- Chrome (hosts, `icons.tsx`, `toast-host.tsx`) is non-registered, non-Sd-named, exempt from the rules like editor chrome.
- `npm run typecheck` stays red until Task 7 (11 files still import `@siemens`). Per-task: ensure no NEW errors reference your files; full green is Task 8's gate.

## Review Focus

1. **Rules §4 composition** — a component that emits before letting `rest.onClick` run breaks editor selection. Test: grep each new Sd* component's handler for `rest.onClick?.(event)` before `onChange?.(`.
2. **check:components false-pass** — comments must not satisfy checks; rely on the script, run it in every component task.
3. **Tree conversion** — `TreeModel` → `TreeItem[]` with missing child ids could loop or crash. Test: `npm run typecheck` + edit-page renders sidebar with root children.
4. **CSS token loss** — `admin.scss` uses 5 iX CSS vars; undefined vars silently lose borders/text color. Test: `npm run build` + visual check of admin pages light/dark.
5. **Registration completeness** — a component in `index.ts` but missing from `palette` (or vice versa) violates rules §6. Test: final task greps both files for each new component name.

---

### Task 1: Icon module

**Files:**

- Create: `client/src/components/icons.tsx`

**Interfaces:**

- Produces: `export type SdIconName`; `export const sdIcons: Record<SdIconName, () => ReactElement>`; `export const SdIcon = ({ name, size }: { name?: SdIconName; size?: number }) => ReactElement | null`. Stroke SVGs, 24 viewBox, `currentColor` — mirror `routes/dashboard/icons.tsx:3-17`.

Icon names (the full iX icon inventory, renamed): `home`, `tasks`, `tools`, `folder`, `tree`, `user`, `logout`, `plus`, `save`, `trash`, `refresh`, `upload`, `close`, `chevronRight`, `file`, `circle`, `node`, `check`, `sun`, `moon`.

- [ ] Create `icons.tsx` with the 20 icons (simple paths; see dashboard `icons.tsx` for the `icon()` helper pattern).
- [ ] Run `npx tsc --noEmit -p tsconfig.json` — expect only pre-existing `TS2307 @siemens` errors, none from `icons.tsx`.

### Task 2: Button family — SdButton upgrade + SdIconButton

**Files:**

- Modify: `client/src/components/SdButton.tsx` (whole file)
- Create: `client/src/components/SdIconButton.tsx`
- Modify: `client/src/components/index.ts`, `client/src/routes/dashboard/registry.ts` (palette record ~line 119)

**Interfaces:**

- Consumes: `SdIcon`, `SdIconName` (Task 1).
- Produces:
  - `SdButtonProps extends ComponentProps<string>` — `variant?: "primary" | "secondary" | "danger" | "ghost"`, `icon?: SdIconName`, `disabled?: boolean`, `type?: "button" | "submit" | "reset"`. Renders `<button>`; label = `children ?? value`; icon before label; Tailwind classes per variant; composes `rest.onClick` then `onChange?.({ type: "click", payload: { value } })`.
  - `SdIconButtonProps extends ComponentProps<SdIconName>` — `title: string` (aria-label), `variant?`, `disabled?`. Same click contract; renders `SdIcon` inside a square button.
- Palette: `SdIconButton` entry, group `form`, `defaultProps: () => ({ type: "SdIconButton", value: "check" })`; mirror the shape of the existing `SdButton` entry (registry.ts:192). Update `SdButton` `defaultProps` if it referenced the old markup.

- [ ] Rewrite `SdButton.tsx` and create `SdIconButton.tsx` per contract.
- [ ] Register `SdIconButton` in `components/index.ts` and both in the `palette` record.
- [ ] Run `npm run check:components` — `SdButton`/`SdIconButton` listed `v`, overall `OK`.
- [ ] Run `npx eslint src/components/SdButton.tsx src/components/SdIconButton.tsx` — clean.

### Task 3: Form controls — SdInput, SdTextarea, SdSelect, SdCheckbox

**Files:**

- Create: `client/src/components/SdInput.tsx`, `SdTextarea.tsx`, `SdSelect.tsx`, `SdCheckbox.tsx`
- Modify: `client/src/components/index.ts`, `client/src/routes/dashboard/registry.ts`

**Interfaces:**

- Produces (each extends `ComponentProps` with wildcard; composes native handler first, then emits `change`):
  - `SdInput`: `value?: string`, `type?: string` (default `"text"`), `label?`, `placeholder?`, `disabled?`, `required?`. Emits `{ type: "change", payload: { value: string } }`.
  - `SdTextarea`: `value?: string`, `label?`, `rows?`, `disabled?`. Same `change` payload.
  - `SdSelect`: `value?: string`, `options?: Array<{ value: string; label: string }>`, `label?`, `disabled?`. Native `<select>` + `<option>` list. Same `change` payload.
  - `SdCheckbox`: `value?: boolean`, `label?`, `disabled?`. Emits `{ type: "change", payload: { value: boolean } }`.
- Shared markup: label above control, Tailwind `border-zinc-300 bg-zinc-50 focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950`.
- Palette: 4 entries, group `form`, icons: `input`, `textarea`, `select`, `label`. `defaultProps()` returns `{ type: "SdX", label: "…" }`.

- [ ] Create the 4 components per contract.
- [ ] Register in `components/index.ts` + `palette`.
- [ ] Run `npm run check:components` — all 4 `v`, overall `OK`.
- [ ] Run `npx eslint src/components/Sd*.tsx` — clean.

### Task 4: Feedback + layout — SdToast, toast system, SdCard, SdPageHeader, SdKpi, SdBreadcrumb

**Files:**

- Create: `client/src/components/SdToast.tsx`, `SdCard.tsx`, `SdPageHeader.tsx`, `SdKpi.tsx`, `SdBreadcrumb.tsx`, `client/src/components/toast-host.tsx`, `client/src/lib/toast.store.ts`
- Modify: `client/src/routes/root-layout.tsx` (mount `ToastHost` next to `ModalHost`), `components/index.ts`, `routes/dashboard/registry.ts`

**Interfaces:**

- Produces:
  - `lib/toast.store.ts`: `export type ToastType = "success" | "error" | "info"; export interface Toast { id: number; title: string; type: ToastType }`. zustand store (NOT persisted): `toasts: Toast[]`, `pushToast(title, type)`, `dismissToast(id)`. `export const toast = (title: string, type: ToastType) => void` — pushes and auto-dismisses after 4000 ms via `setTimeout`. Replaces `showToast` (import sites: edit-page:8, files-page:8, tasks-page:9, file-editor-dialog:2).
  - `SdToast` (registered): `value?: { title: string; type: ToastType }`, `onDismiss?`. One toast: colored left border by type (`green-500`/`red-500`/`blue-500`), title, close icon (`SdIcon name="close"`) calling `rest.onClick` then `onChange?.({ type: "click" })`.
  - `toast-host.tsx` (chrome): fixed `top-4 right-4 z-[1200] flex flex-col gap-2`; maps `toasts` → `<SdToast value={…} onDismiss={() => dismissToast(id)} />`.
  - `SdCard`: `value?: string` renders `<h3>` title, children below; `rounded-lg border p-4`.
  - `SdPageHeader`: `value?: string` (title), `subtitle?: string`, children = actions slot right-aligned on one row.
  - `SdKpi`: `value?: string | number`, `label?: string`.
  - `SdBreadcrumb`: `value?: { current: Array<{ id: string; label: string }>; next?: Array<{ id: string; label: string }> }`; `onSelect?: (id: string) => void`. Renders `current` as buttons separated by `SdIcon chevronRight`, then dim `››` + `next` if present. Emits `onSelect(id)` AND `{ type: "select", payload: { value: id } }` per crumb click.
- Palette: `SdToast`→`components`/`dialog`; `SdCard`→`components`/`box`; `SdPageHeader`→`components`/`header`; `SdKpi`→`components`/`meter`; `SdBreadcrumb`→`components`/`listItem`.

- [ ] Create `lib/toast.store.ts` (store + `toast()` with 4 s auto-dismiss).
- [ ] Create the 5 Sd components per contract; `toast-host.tsx` chrome.
- [ ] Mount `<ToastHost />` in `root-layout.tsx`.
- [ ] Register the 5 components in `components/index.ts` + `palette`.
- [ ] Run `npm run check:components` — `OK`.
- [ ] Run `npm run typecheck` — only pre-existing `@siemens` TS2307 errors, none in new files.

### Task 5: App shell — SdApplication, admin-layout rewrite, admin.scss detox

**Files:**

- Create: `client/src/components/SdApplication.tsx`
- Modify: `client/src/routes/admin/admin-layout.tsx`, `client/src/stylesheets/admin.scss`, `components/index.ts`, `routes/dashboard/registry.ts`

**Interfaces:**

- Consumes: `SdIcon`, `SdIconName` (Task 1).
- Produces:
  - `SdApplicationProps extends ComponentProps<ReactNode>`: `brand?: string` (default `"mtCMS"`), `navItems?: Array<{ href: string; label: string; icon: SdIconName }>`, `activeHref?: string`, `user?: { username: string; role: string } | null`, `theme?: "light" | "dark"`, `onToggleTheme?: () => void`, `onNavigate?: (href: string) => void`, `onLogout?: () => void`, `children` = page content.
    - Layout: header row (`h-12 border-b`: brand left; right: theme toggle icon-button (`sun`/`moon`), `username (role)` text, `logout` icon-button) + body row (`flex`: sidebar `w-56 border-r` nav items, active via `activeHref`; `<main className="flex-1 overflow-auto">{children}</main>`). No sidebar when `navItems` undefined (login state renders just content).
  - Palette: group `layout`, icon `layout`, `defaultProps: () => ({ type: "SdApplication", brand: "mtCMS" })`.
  - `admin-layout.tsx` rewrite: delete both `@siemens` imports (lines 3-19) and `ix-admin` wrapper; `navItems` typed with `SdIconName` (`home`, `tasks`, `tools`, `folder`, `tree`); render `<SdApplication brand="mtCMS" navItems={token ? navItems : undefined} activeHref={pathname} user={token ? { username, role } : null} theme={theme} onToggleTheme={toggleTheme} onNavigate={navigate} onLogout={handleLogout}>{token ? <Outlet /> : <LoginForm />}</SdApplication>`. Keep `import "../../stylesheets/admin.scss"`.
  - `admin.scss`: delete lines 1-3 (iX CSS imports), `.ix-admin` block (5-7), both `ix-textarea` rules (224-235). Add tokens: `:root { --admin-border: #d4d4d8; --admin-primary: #00bde3; --admin-field-bg: #ffffff; --admin-text: #171717; } .dark { --admin-border: #3f3f46; --admin-field-bg: #09090b; --admin-text: #ededed; }`. Replace: `--theme-color-soft-bdr`→`--admin-border`, `--theme-color-primary`→`--admin-primary`, `--theme-color-inv-std-bdr`→`--admin-field-bg`, `--theme-color-std-text`→`--admin-text`.

- [ ] Create `SdApplication.tsx`; register in `index.ts` + `palette`.
- [ ] Rewrite `admin-layout.tsx`; remove all `@siemens` imports.
- [ ] Apply `admin.scss` detox.
- [ ] Run `npm run check:components` — `OK`; `npx eslint` on touched files — clean.

### Task 6: Edit area — store tree types, node-tree, breadcrumb, edit-page

**Files:**

- Modify: `client/src/lib/edit.store.ts`, `client/src/components/edit/node-tree.tsx`, `client/src/components/edit/node-breadcrumb.tsx`, `client/src/routes/admin/edit-page.tsx`, `client/src/components/SdBreadcrumb.tsx` (add `onSelect` if not already present)

**Interfaces:**

- Produces (edit.store.ts): `export interface EditTreeNode { id: string; data: { name: string }; hasChildren: boolean; children: string[] }`; `export type EditTreeModel = Record<string, EditTreeNode>`. Delete iX import (line 3); `TreeState` = `{ model: EditTreeModel }` (context removed); delete `setTreeContext` (state + interface); `buildTreeState` keeps model logic only.
- `node-tree.tsx` rewrite: remove `IxTree`; `toItems(model, rootId)` resolving `children` ids recursively with a `seen: Set<string>` cycle guard → `{ id, title: model[id]?.data.name ?? id, children }`. Render `<SdTree value={toItems(model, ZERO_UUID)} selectedId={node?.id} onSelect={(item) => { const id = String(item.id); if (id && id !== selectedNodeId) { navigate(`/admin/edit/${encodeURIComponent(id)}`); void fetchNode(id); } }} />`.
- `node-breadcrumb.tsx` rewrite: remove `IxBreadcrumb*`; `value={{ current: lineage.map(...), next: children.map(...) }}`; `onSelect={(id) => void fetchNode(id)}`.
- `edit-page.tsx` rewrite: iX imports (3-10) → `SdPageHeader`, `SdSelect` (en/de options), 3× `SdButton` (`icon="plus"`, `icon="save"`, `icon="trash"` `variant="danger"`); `showToast` → `toast()` from `lib/toast.store`; **re-enable `<NodeTree />` (line 189)**; error colors → `text-red-600 dark:text-red-400`.

- [ ] Apply `edit.store.ts` type localization.
- [ ] Rewrite `node-tree.tsx`, `node-breadcrumb.tsx`, `edit-page.tsx`; re-enable `<NodeTree />`.
- [ ] Ensure `SdBreadcrumb.onSelect` exists (Task 4 amendment).
- [ ] Run `npm run typecheck` — no errors in touched files; `npx eslint` on them — clean.

### Task 7: Remaining pages — dashboard, tools, tasks, files, login-form, file-editor-dialog

**Files:**

- Modify: `client/src/routes/admin/dashboard-page.tsx`, `tools-page.tsx`, `tasks-page.tsx`, `files-page.tsx`, `client/src/components/login-form.tsx`, `file-editor-dialog.tsx`

Mapping (delete every `@siemens` import):

- **dashboard-page:** `IxContentHeader`→`SdPageHeader`; `IxKpi`→`SdKpi label value` ×4; `IxCard/Title/Content`→`SdCard value="…"`; error color → Tailwind red.
- **tools-page:** `IxContentHeader`→`SdPageHeader value subtitle`; `IxSelect`→`SdSelect options`; `IxActionCard`→ `SdCard value={nodeTitle(node)}` + `SdIcon` inside the `<Link>`; `iconFor`/`ICON_BY_*` → `SdIconName` (root→`circle`, node→`node`, trash→`trash`, user→`user`, default→`file`); error color → Tailwind.
- **tasks-page:** `IxContentHeader`→`SdPageHeader`; `IxInput`→`SdInput`; `IxSelect`→`SdSelect`; `IxCheckbox`→`SdCheckbox`; `IxButton`→`SdButton icon="plus"`; `showToast`→`toast()`; icons → `plus`/`trash`.
- **files-page:** `IxContentHeader`→`SdPageHeader`; 11× `IxIconButton`→`SdIconButton value=<icon>` (chevronRight, folder, file, upload, refresh, trash); drop `slot`/`size`; `showToast`→`toast()`; error color → Tailwind.
- **login-form:** `IxContentHeader`→`SdPageHeader value="Sign in"`; 2× `IxInput`→`SdInput` controlled; `IxButton`→`SdButton type="submit"`; error color → Tailwind.
- **file-editor-dialog:** `IxButton`→`SdButton icon="save"`; `IxIconButton`→`SdIconButton value="close"`; `showToast`→`toast("File saved", "success")`; error color → Tailwind.

- [ ] Rewrite the 6 files (read each fully first).
- [ ] Run `npm run typecheck` — **fully green** (last `@siemens` consumers).
- [ ] Run `npx eslint` on the 6 files — clean.

### Task 8: Final removal sweep, docs, full gates

**Files:**

- Modify: `README.md:6`, `ai/PROJECT.md:7` (remove "Siemens iX" → "own Sd* component library (ai/rules/components.md)")

- [ ] Grep gate: `@siemens|siemens-ix|Ix[A-Z]|ix-textarea|ix-admin|showToast` in `client/src` → 0 matches; `Siemens` in `README.md`, `ai/` → 0.
- [ ] Registration gate: each new component name in BOTH `components/index.ts` and `palette`.
- [ ] `npm run check:components` → OK.
- [ ] `npm run typecheck` → green.
- [ ] `npm run lint` → green.
- [ ] `npm run build` → green.
- [ ] Smoke: `npm run dev` — no dependency-scan error; check `/admin` pages light+dark, one toast.
