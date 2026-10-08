# Spec: Sd* component styling → `components.scss` (token-driven)

Status: approved (Sections 1–3 approved 2026-10-08 in brainstorming session).
Path: architectural → spec → review → writing-plans → implement.

## Background and rulings

The `Sd*` component library currently carries its visual identity as Tailwind
utility strings inside JSX: **26 component files, ~158 color utilities, 73
`dark:` variants**. The user ruled:

1. **Scope**: all registered `Sd*` components (everything in
   `client/src/components/index.ts`), **including `SdSplitHandle`** (previously
   checker-exempt; it must be registered properly).
2. **Split rule**: colors, typography, borders, shadows, and interactive visual
   states move to `client/src/stylesheets/components.scss`. Structural layout
   utilities (flex/grid/spacing/sizing/overflow/truncation) stay in JSX.
3. **Approach B (chosen over A/C)**: dark/light theming comes from shared
   tokens in `client/src/stylesheets/theme.css` — **no per-component `.dark`
   blocks** in `components.scss`; `.dark` overrides live only in `theme.css`.

Preceding work (done, verified, ledgered): the 4 dashboard fixes — Config
text→white, tree yellow→sky-300, board button→gray-800, DevTools scrollbars.
Ledger: `.superpowers/sdd/2026-10-07-siemens-ix-removal/progress.md`.

## Section 1 — Token vocabulary (`theme.css`)

Add the following tokens to the existing `:root` (light) and `.dark` blocks.
Existing tokens are kept as-is; no renames in this step.

| Token                | Light      | Dark       | Replaces                                       |
| -------------------- | ---------- | ---------- | ---------------------------------------------- |
| `--surface`          | `white`    | `zinc-950` | `bg-white dark:bg-zinc-950` (app root)         |
| `--surface-raised`   | `white`    | `zinc-900` | card / toast / secondary-button bg             |
| `--surface-sunken`   | `zinc-50`  | `zinc-950` | input / select / textarea field bg             |
| `--surface-hover`    | `zinc-100` | `zinc-800` | all `hover:bg-zinc-100 dark:hover:bg-zinc-800` |
| `--fg`               | `zinc-900` | `zinc-50`  | strong text (titles, values)                   |
| `--fg-base`          | `zinc-700` | `zinc-300` | default text (labels, nav, links)              |
| `--fg-muted`         | `zinc-500` | `zinc-400` | secondary text (subtitles, hints)              |
| `--fg-subtle`        | `zinc-400` | `zinc-400` | separators, placeholders, breadcrumbs `…`      |
| `--border`           | `zinc-200` | `zinc-700` | card / input / divider borders                 |
| `--border-strong`    | `zinc-300` | `zinc-600` | interactive control borders (field, checkbox)  |
| `--focus`            | `blue-500` | `blue-500` | `focus:border-blue-500`                        |
| `--accent`           | `sky-600`  | `sky-500`  | primary button bg, checkbox checked            |
| `--accent-hover`     | `sky-700`  | `sky-400`  | primary hover bg                               |
| `--accent-subtle-bg` | `sky-50`   | `zinc-800` | active nav item bg                             |
| `--accent-subtle-fg` | `sky-700`  | `sky-400`  | active nav item text                           |
| `--danger`           | `red-600`  | `red-500`  | danger button bg (white text stays legible)    |
| `--danger-fg`        | `red-600`  | `red-400`  | error text                                     |

Rules:

- **One shade of drift collapses to the nearest level** — e.g. today's
  `zinc-800` label vs `zinc-700` label both map to `--fg-base`. No
  token-per-shade.
- Static-across-theme values are plain SCSS with **no token**: white text on
  accent/danger buttons, toast status stripes (`blue-500`/`green-500`/`red-500`),
  dashboard widget internals (`.Wave` green hexes, `.Gauge`).
- Scrollbar tokens from the 4-fix batch (`--scrollbar-thumb`,
  `--scrollbar-thumb-hover`) remain unchanged.

## Section 2 — Naming, split rule, precedence

### Naming convention

One semantic root class per component, modifiers for variants, element classes
for sub-parts:

```
.sd-application .sd-breadcrumb .sd-card .sd-kpi .sd-page-header .sd-toast
.sd-button.sd-button--primary / --secondary / --danger / --ghost
.sd-icon-button(+ mode modifiers)
.sd-field .sd-field-label        (shared: input/select/textarea)
.sd-checkbox
.sd-card__title .sd-kpi__label .sd-breadcrumb__link
.sd-split-handle
.sd-nav-item / .sd-nav-item--active .sd-topbar .sd-sidebar   (SdApplication parts)
.sd-toast--info / --success / --error
```

Composition pattern in JSX (preserves author/board classes):

```tsx
className={["sd-card", rest.className].filter(Boolean).join(" ")}
```

### Move/stay split

- **→ SCSS**: bg/text/border _colors_; `hover:`/`focus:`/`disabled:` visual
  states (`transition-colors`, `outline-none`, `disabled:opacity-50`,
  `cursor-*` where component-local); `shadow-*`; typography (`text-sm`,
  `font-semibold`, `font-mono`, `text-2xl`, `leading-*`, `opacity-*` text).
- **← JSX**: `flex*`, `grid`, `items-*`, `justify-*`, `gap-*`, all spacing
  (`p-*`, `px-*`, `mb-*`, …), sizing (`w-*`, `h-*`, `shrink-0`), `overflow-*`,
  `truncate`, and `border-l-4` stripe _width_ (color moves).

### Precedence guarantee

`components.scss` wraps everything in `@layer components` (already the case).
Tailwind author/registry classNames live in `@layer utilities`, which always
wins over `components`. Component default < author className — more
deterministic than today (both were utilities; source order decided).

## Section 3 — Per-component inventory

| Component                                                      | Classes added                                                                                                                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SdApplication`                                                | `.sd-application` (root), `.sd-topbar`, `.sd-sidebar`, `.sd-nav-item`/`--active`, nav icon-button modifier                                                                                       |
| `SdButton`                                                     | `.sd-button` + `--primary/--secondary/--danger/--ghost` (`VARIANTS` map moves wholesale)                                                                                                         |
| `SdIconButton`                                                 | `.sd-icon-button` + mode modifiers                                                                                                                                                               |
| `SdCard`, `SdKpi`                                              | `.sd-card`, `.sd-kpi`, `.sd-card__title`, `.sd-kpi__label`                                                                                                                                       |
| `SdInput`/`SdSelect`/`SdTextarea`                              | shared `.sd-input`/`.sd-select`/`.sd-textarea` (container), `.sd-field`, `.sd-field-label`, `:focus` → `var(--focus)`                                                                            |
| `SdCheckbox`                                                   | `.sd-checkbox` + `input { accent-color: var(--accent); … }`                                                                                                                                      |
| `SdBreadcrumb`                                                 | `.sd-breadcrumb`, `.sd-breadcrumb__link`                                                                                                                                                         |
| `SdPageHeader`                                                 | `.sd-page-header` (+ title/subtitle classes)                                                                                                                                                     |
| `SdToast`                                                      | `.sd-toast`, `--info/--success/--error` (bg via `--surface-raised`+`--border`; stripe colors static)                                                                                             |
| `SdText`, `SdPane`, `SdTree`, `SdWave*`, `SdGauge`, `SdDummy*` | no/minimal color JSX — existing `.Tree`/`.Wave`/`.Gauge` rules stay as-is. Typography-only JSX (e.g. `SdWave` `font-mono text-4xl font-bold`) still moves to a semantic class per the split rule |

### Stylesheet loading (self-review finding)

`components.scss` is currently `@use`d only from `app.scss`, which is imported
only by `routes/dashboard/dashboard-page.tsx` — but `SdButton`, `SdInput`,
`SdPageHeader`, `SdToast`, `SdCard`, `SdKpi`, `SdSelect`, `SdCheckbox`,
`SdIconButton`, `SdApplication` also render on login, `toast-host`, and
`routes/admin/*`, whose CSS chunks never load `components.scss`.

Resolution:

- Import `components.scss` once from `client/src/main.tsx` (after
  `globals.css`) so the `.sd-*` rules land in the **index chunk**, always
  loaded by the SPA.
- Remove `@use './components.scss';` from `app.scss` (avoids double emission
  into the dashboard chunk).
- Verify after build: `.sd-card`/`.sd-button` rules present in
  `dist/assets/index-*.css`; dashboard/admin pages visually unchanged.

Note: `admin.scss` defines a parallel `--admin-*` token set — observed,
deliberately out of scope (admin page chrome, not an `Sd*` component).

### SdSplitHandle (added to scope by user instruction)

1. **Conform to the contract**
   - `interface SdSplitHandleProps extends ComponentProps` with the mandatory
     explicit `[key: string]: unknown`.
   - `label`, `sign` (`1 | -1`), `orientation` become **optional** with
     defaults (`"Resize panel"`, `1`, `"vertical"`).
   - `onResize`/`onReset` become **optional**, guarded `?.()` at call sites
     (palette drops supply no handlers).
   - Emit events per rules §4: `onChange?.({ type: "resize", payload: { value: delta } })`
     and `onChange?.({ type: "reset", payload: { value: 0 } })`.
   - Existing call sites (`Editor.tsx:267`, `dashboard-page.tsx:244,262`) keep
     passing all props explicitly — behavior unchanged.
2. **Register**
   - Remove the `EXEMPT` entry for `SdSplitHandle.tsx` in
     `client/scripts/check-component-props.mjs` (output becomes `v`).
   - Already imported in `client/src/components/index.ts`.
   - Add palette entry in `client/src/routes/dashboard/registry.ts`:
     ```ts
     SdSplitHandle: {
       type: "SdSplitHandle",
       title: "Split Handle",
       icon: <existing IconName>,
       group: "layout",
       droppable: true,
       defaultProps: () => ({ label: "Resize", sign: 1, orientation: "vertical" }),
       settings: [],
     },
     ```
3. **Style** — move `bg-gray-800 hover:bg-teal-600 focus:bg-teal-600
   data-[dragging=true]:bg-teal-500` into `.sd-split-handle` in
   `components.scss` using `:hover`, `:focus`, `[data-dragging="true"]`
   selectors. **Static colors (no token)**: every usage context (dashboard
   canvas, editor panes, palette drops) is always-dark. `cursor-row/col-resize`
   and the `HANDLE_WIDTH` inline size stay in JSX.

## Invariants

- Props contract and `ai/rules/components.md` unchanged; `check:components`
  is the mechanical gate (now expecting 23 conforming components, 0 exempt).
- Board/registry `className` data untouched and still winning via
  `@layer utilities`.
- No `dark:` color variants may remain inside `Sd*.tsx` JSX after the move
  (except static-across-theme values with no theme-dependent color at all).
- Theme flip mechanism untouched: `.dark` class on `<html>`; `theme.css` is the
  only file with `.dark` overrides.
- `background: var(...)` shorthands are forbidden — CSS pipeline empties them;
  use `background-color: var(...)` (ruling from the 4-fix batch).
- Dashboard widget internals (`.Wave`, `.Gauge` hex colors) are not re-themed.
- Editor chrome (`Editor.tsx`, `Config.tsx`, `modal-host.tsx`,
  `login-form.tsx`, `file-editor-dialog.tsx`, `theme-switcher.tsx`) is out of
  scope (already handled by the 4-fix batch where relevant).

## Verification

1. Gates: `npm run typecheck` = 0; `npm run check:components` = OK 23/23, 0
   exempt; `npm run build` = 0.
2. Playwright sweep (both themes, light + dark):
   - computed-color spot checks on `/` (admin shell if reachable), `/dashboard`:
     card bg, each `SdButton` variant, field focus border, toast, breadcrumb,
     nav-active, split handle colors;
   - precedence: board node `SdButton` with `bg-gray-800` still wins;
   - split handle drag still resizes panes; keyboard arrows still work;
   - no `dark:` color utilities remain in `Sd*.tsx` (grep assertion);
   - screenshots light/dark for human review.
3. Ledger results in `.superpowers/sdd/2026-10-07-siemens-ix-removal/progress.md`.
