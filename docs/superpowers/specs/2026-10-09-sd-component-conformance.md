# Spec: Sd* component conformance — contract-only props, config, styling

Status: draft — pending user review.
Path: architectural → spec → review → writing-plans → implement.
Supersedes: `2026-10-08-sd-component-styling.md` where the two conflict
(SdSplitHandle scope, class naming, props model). The token vocabulary and
move/stay split rule from that spec are reused where still valid.

## Background

`ai/rules/code-guideline.md` ("SD components") and `ai/rules/components.md`
define the target for every `Sd*` component. An audit of all 24
`client/src/components/Sd*.tsx` files shows only `SdCheckbox` (just reworked)
fully conforms. The rest declare component-specific props at the top level,
carry inline Tailwind utility classes, and/or contain comments.

### User rulings (this session)

- **R1 — everything into `config`.** All non-contract props move under
  `config`, including callbacks (`onSelect`, `onMove`, `onNavigate`,
  `onDismiss`, `renderIcon`, `canDropInside`, `onToggleTheme`, …), mirroring
  `SdDummy.config.actions` and `SdCheckbox.config`.
- **R2 — special components.** `SdSplitHandle` stays exempt (editor chrome,
  not droppable). `SdDummyContainerComponent` / `SdDummyLeafComponent` are
  brought into rule compliance but are **not** registered in the palette.
- **R3 — prop type is `SdComponentProps` exclusively.** Each component's props
  interface declares **no own members**; only the mandatory wildcard. No
  `label?`, `variant?`, `options?`, etc. anywhere.
- **R4 — model files.** One model file per component at
  `client/src/models/sd-<name>.ts` holding that component's config / value /
  domain types. Fold `sd-checkbox-config.ts` into `sd-checkbox.ts`.
- **R5 — comments.** Strip all comments from every `Sd*.tsx`; preserve critical
  behavioural notes in this spec and in model JSDoc.
- **R6 — stylesheet consolidation.** Optimise the CSS/SCSS and rename all to
  `.scss` (full consolidation). The Tailwind entry is the one exception (stays
  `.css` — see Section 4a spike result).

### Relationship to the prior styling spec

`2026-10-08-sd-component-styling.md` (status: approved, **not implemented** —
no `.sd-*` class exists in the tree) ruled that `SdSplitHandle` would be brought
onto the contract and registered. That is **overridden** by R2. Its token
vocabulary and "colors/typography → SCSS, structural utilities stay in JSX" split
still apply, subject to the naming decision below. Its stylesheet-loading fix
(`components.scss` currently loads only into the dashboard chunk) is still
required and is carried into Section 4.

## Goals / non-goals

**Goals**

- Every `Sd*.tsx` (except the exempt `SdSplitHandle`) uses `SdComponentProps`
  exclusively, with all setup in `config`.
- Type definitions that components share live in `client/src/models/*`.
- No Tailwind utility classes inside `Sd*.tsx`; component styling lives in
  `client/src/stylesheets/components.scss`.
- Components carry no comments.
- The dashboard registry reflects the new `{ value, config }` shape and gains a
  palette entry for the missing content component `SdTree`.

**Non-goals**

- Reworking `SdSplitHandle` or registering it.
- Registering `SdDummyContainerComponent` / `SdDummyLeafComponent`.
- Changing runtime behaviour, event semantics, or the token palette.
- Restyling editor chrome (`components/editor/*`) or admin page chrome.

## Section 1 — Canonical component shape

```tsx
import { useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdThingConfig, SdThingValue } from "../models/sd-thing";

interface SdThingProps extends SdComponentProps<SdThingValue, SdThingConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdThingConfig = { variant: "primary" };

const SdThing = (props: SdThingProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } = props;
  const settings = { ...DEFAULT_CONFIG, ...config };

  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  return (
    <div
      {...rest}
      className={["sd-thing", rest.className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
};

export default SdThing;
```

Rules:

- Props interface body is **only** the wildcard; the shape comes entirely from
  `SdComponentProps<TValue, TConfig, TEvent?, TChildren?>`.
- Consumed props are destructured out of `rest` so they never reach the DOM
  (this is what surfaced on six components when the event type resolved).
- Outgoing events: `onChange?.({ type, payload })`. Incoming: `eventIn` handled
  once via the `useRef` identity guard, dispatched to
  `globalThis.sd.dispatchAction` (when appropriate) and forwarded to `onChange`.
- Component identifiers and props interfaces are `Sd`-prefixed (renames:
  `Text`→`SdText`, `Wave`→`SdWave`, `WaveBar`→`SdWaveBar`,
  `WaveValue`→`SdWaveValue`, `TextProps`→`SdTextProps`, etc.).
- `SdNavNavItem` → `SdApplicationNavItem`.

## Section 2 — Models layout

One file per component **that has setup or domain types**:
`client/src/models/sd-<name>.ts`. It exports the component's `Sd<Name>Config`,
its value type (`Sd<Name>Value`), and any domain types it owns. Components with
no setup beyond the contract get **no** config type or model file — they use
`SdComponentProps<TValue>` directly (this applies to `SdCard` and `SdPane`). The
props interface stays in the component file.

| Model file | Types relocated from component |
| --- | --- |
| `sd-application.ts` | `SdApplicationNavItem` (was `SdNavNavItem`), `SdApplicationConfig` |
| `sd-breadcrumb.ts` | `SdBreadcrumbItem`, `SdBreadcrumbValue`, `SdBreadcrumbConfig` |
| `sd-button.ts` | `SdButtonVariant`, `SdButtonConfig` |
| `sd-checkbox.ts` | `SdCheckboxConfig` (fold `sd-checkbox-config.ts`, delete it) |
| `sd-d3-graph.ts` | `SdD3GraphPoint`, `SdD3GraphValue`, `SdD3GraphConfig` |
| `sd-dummy.ts` | `SdDummyValue`, `SdDummyAction`, `SdDummyConfig` |
| `sd-gauge.ts` | `SdGaugeConfig` (imports `SdWaveSource` from `sd-wave.ts`) |
| `sd-icon-button.ts` | `SdIconButtonConfig` |
| `sd-input.ts` | `SdInputConfig` |
| `sd-kpi.ts` | `SdKpiConfig` |
| `sd-page-header.ts` | `SdPageHeaderConfig` |
| `sd-select.ts` | `SdSelectOption`, `SdSelectConfig` |
| `sd-text.ts` | `SdTextConfig` |
| `sd-textarea.ts` | `SdTextareaConfig` |
| `sd-toast.ts` | `SdToastValue`, `SdToastConfig` |
| `sd-tree.ts` | `TreeItem`, `TreeItemState`, `TreeItemTemplate`, `TreeDropPosition`, `TreeDropTarget`, `SdTreeConfig` |
| `sd-wave.ts` | `SdWaveConfig`, `SdWaveBarConfig`, `SdWaveValueConfig` (+ shared `SdWaveSource`) |

DEFAULT_* constants stay in the component file (they are component defaults,
not types).

Open cross-layer edges to resolve in the plan: `SdIconName` currently lives in
`components/icons.ts` and is the value type of `SdIconButton`; `SdWaveSource`
derives from `DeepKeys<WaveState>` in `routes/dashboard/store`. Either relocate
these to `models/` or have the model import them and accept the dependency —
decide once, apply consistently.

## Section 3 — Config inventory

Extra props become `Sd<Name>Config` fields. Callbacks are config members.

| Component | Extra props → config fields | Value type | Consumers to update |
| --- | --- | --- | --- |
| `SdApplication` | `brand`, `navItems`, `activeHref`, `user`, `theme`, `onToggleTheme`, `onNavigate`, `onLogout` | `ReactNode` | `routes/admin/admin-layout.tsx` |
| `SdBreadcrumb` | `onSelect` | `SdBreadcrumbValue` | `components/edit/node-breadcrumb.tsx` |
| `SdButton` | `variant`, `icon`, `disabled`, `type` | `string` | `login-form.tsx`, `file-editor-dialog.tsx`, `admin/edit-page.tsx`, `admin/tasks-page.tsx` |
| `SdCard` | (none) | `unknown` | `admin/dashboard-page.tsx`, `admin/tools-page.tsx` |
| `SdCheckbox` | `label`, `disabled` (done) | `boolean` | `admin/tasks-page.tsx` |
| `SdD3Graph` | `title`, `width`, `height`, `r`, `fill`, `opacity`, `xLabel`, `yLabel` | `SdD3GraphValue` | none |
| `SdDummy` | `title`, `actions` | `SdDummyValue` | `editor/Config.tsx`, `SdDummyLeafComponent.tsx` |
| `SdGauge` | `title`, `source`, `min`, `max` | `unknown` | none |
| `SdIconButton` | `title`, `variant`, `disabled` | `SdIconName` | `file-editor-dialog.tsx`, `admin/files-page.tsx` |
| `SdInput` | `type`, `label`, `placeholder`, `disabled`, `required` | `string` | `login-form.tsx`, `admin/tasks-page.tsx` |
| `SdKpi` | `label` | `string \| number` | `admin/dashboard-page.tsx` |
| `SdPageHeader` | `subtitle` | `unknown` | `login-form.tsx`, `admin/{dashboard,files,tools,edit,tasks}-page.tsx` |
| `SdPane` | (none) | `unknown` | none |
| `SdSelect` | `options`, `label`, `disabled` | `string` | `admin/{tools,edit,tasks}-page.tsx` |
| `SdText` | `title` | `unknown` | none |
| `SdTextarea` | `label`, `rows`, `disabled` | `string` | none |
| `SdToast` | `onDismiss` | `SdToastValue` | `components/toast-host.tsx` |
| `SdTree` | `renderIcon`, `selectedId`, `onSelect`, `defaultExpandedIds`, `onMove`, `onDropExternal`, `canDropInside` | tree data | `editor/Editor.tsx`, `edit/node-tree.tsx` |
| `SdWave` | `title`, `source` | `unknown` | none |
| `SdWaveBar` | `title`, `source` | `unknown` | none |
| `SdWaveValue` | `title`, `source` | `unknown` | none |

## Section 4 — Styling

**Naming (decision for review).** Reuse the approved convention from the prior
spec: one semantic root class per component with modifiers/elements
(`.sd-button`, `.sd-button--primary`, `.sd-card__title`). This means renaming the
just-added `.Checkbox*` → `.sd-checkbox*`. Legacy dashboard-widget classes
`.Pane`, `.Wave`, `.Gauge`, `.Tree*` (already in `components.scss`) are retained
as-is unless the reviewer asks to migrate them; `.Dummy`, `.Dummy-children`,
`.Dummy-value`, and `.D3Graph` are referenced by JSX but defined nowhere and must
be added.

**Move/stay split** (from the prior spec):

- → SCSS: colours, typography, borders, shadows, and `hover:`/`focus:`/
  `disabled:` visual states.
- ← JSX: structural layout only (`flex*`, `grid`, `items-*`, `justify-*`,
  `gap-*`, spacing, sizing, `overflow-*`, `truncate`). No colour utilities
  remain in `Sd*.tsx`.

**Stylesheet loading (required).** `components.scss` is `@use`d by `app.scss`,
which is imported only by `routes/dashboard/dashboard-page.tsx`; login, admin,
and `toast-host` never load component styles. Import `components.scss` once from
`client/src/main.tsx` (after the Tailwind entry) and remove the `@use` from
`app.scss`, so the rules land in the always-loaded index chunk.

### Section 4a — Stylesheet consolidation & `.scss` rename (R6, this session)

User directive: optimise the CSS/SCSS and rename all to `.scss` (full
consolidation).

**Spike result (already run, do not undo).** Renaming a Tailwind v4 entry
(`globals.css` / `tailwind.css`) to `.scss` **breaks utility generation**: sass
consumes `@import "tailwindcss"` / `@theme` / `@custom-variant` before the
`@tailwindcss/vite` plugin sees them. Measured: baseline `globals.css` index CSS
emitted utilities (31.3 KB, `--tw-` present); the `.scss` spike dropped every
utility (25.8 KB, zero `--tw-`). **Decision: the single Tailwind entry stays
`.css`; only pure-CSS files become `.scss`.**

**Rename plan.**

| File | Action |
| --- | --- |
| `stylesheets/fonts.css` | → `fonts.scss` |
| `stylesheets/theme.css` | → `theme.scss` |
| `stylesheets/globals.css` / `stylesheets/tailwind.css` | merge into **one** root Tailwind entry, kept as `.css` |
| `stylesheets/{main,app,components,markdown,admin}.scss` | already `.scss`; content-consolidated below |

Import updates: `main.tsx` imports the merged Tailwind entry (`.css`) +
`fonts.scss`; `globals`/entry `@import "./theme.scss"`;
`dashboard-page.tsx` drops its `tailwind.css` import; remove the runtime
`void import("@tailwindcss/browser")` from `main.tsx` and the module shim in
`vite-env.d.ts` (the `@tailwindcss/vite` plugin is authoritative).

**Single Tailwind entry.** Merge `tailwind.css`'s `@source` directives
(`../../index.html`, `../**/*.{ts,tsx}`, `../../public/boards/*.json`) into the
root entry next to `@import "tailwindcss"`, `@custom-variant`, and
`@theme inline`. Confirm after merging that the index chunk still emits the same
utility set as the pre-change baseline (`--tw-` present, `.flex`/`.hidden`/…).

**Token consolidation.** `theme.scss` currently carries three overlapping sets:
legacy (`--background-color`, `--color`, `--border-color`, `--accent-color`,
`--panel-background`, `--border-width`, `--border-radius`, `--bg-code`,
`--link-color`, `--hover-overlay`, `--success`, `--input-bg`, `--input-fg`),
Tailwind-layer (`--background`, `--foreground`), and the component vocabulary
(`--surface*`, `--fg*`, `--border*`, `--focus`, `--accent*`, `--danger*`).
Collapse to one vocabulary plus a small set of theme-invariant constants.
Proposed mapping (values that differ in dark are flagged — see open decision 4):

| Legacy | → Canonical | Conflict? |
| --- | --- | --- |
| `--background`, `--background-color` | `--bg` (new; page background) | light ✓, dark preserves `#1e1e1e` |
| `--foreground` | `--fg` | ✓ |
| `--color` | `--fg-base` | ✓ |
| `--border-color` | `--border-strong` | light ✓; dark `#3c3c3c` vs `#454545` |
| `--accent-color` | `--accent` | light ✓; dark `#007acc` vs `#0e639c` |
| `--panel-background`, `--bg-code` | `--surface-sunken` | light ✓; dark `#252526` vs `#1e1e1e` |
| `--link-color` | `--accent-subtle-fg` | light ✓; dark `#3794ff` vs `#ffffff` |
| `--input-bg` | `--surface-raised` | light ✓; dark `#3c3c3c` vs `#252526` |
| `--input-fg` | `--fg` | ✓ |
| `--hover-overlay` | `--overlay` (new) | value preserved |
| `--success` | `--success` (promote into vocabulary) | value preserved |
| `--border-width`, `--border-radius` | theme-invariant constants | identical in both themes |

Also: drop the duplicate `body { font-family: Arial… }` in `main.scss` in favour
of the single `globals` body rule using `var(--font-sans)`; fold the two
`fonts.css` custom properties into `theme.scss`; delete dead/commented CSS
(`// border: solid 1px red`, commented `#root`, etc.). `admin.scss`'s parallel
`--admin-*` set is out of scope for value consolidation but is renamed
`.css`→`.scss` if any exist (none currently).

## Section 5 — Registry

For every palette item, `defaultProps` returns the `{ value, config }` shape and
`settings` keys use dot paths (Config.tsx already resolves/patches dot paths).

Example:

```ts
SdButton: {
  type: "SdButton",
  title: "Button",
  icon: "buttonPointer",
  group: "components",
  defaultProps: () => ({ value: "Button", config: { variant: "primary" } }),
  settings: [
    { key: "value", label: "Label" },
    { key: "config.variant", label: "Variant", kind: "select",
      options: ["primary", "secondary", "danger", "ghost"] },
  ],
},
```

Add the missing content component:

```ts
SdTree: {
  type: "SdTree",
  title: "Tree",
  icon: "listItem",
  group: "components",
  droppable: false,
  defaultProps: () => ({
    value: [
      { id: "root", label: "Root", children: [{ id: "child", label: "Child" }] },
    ],
    config: {},
  }),
  settings: [],
},
```

`SdSplitHandle`, `SdDummyContainerComponent`, and `SdDummyLeafComponent` are not
added. Every existing `settings` key that referenced a now-moved prop is
rewritten to `config.<field>`.

## Section 6 — Consumers

Thirteen files update call sites to the `config` API (the registry is counted in
Section 5):

`routes/admin/admin-layout.tsx`, `routes/admin/dashboard-page.tsx`,
`routes/admin/tools-page.tsx`, `routes/admin/files-page.tsx`,
`routes/admin/edit-page.tsx`, `routes/admin/tasks-page.tsx`,
`components/login-form.tsx`, `components/file-editor-dialog.tsx`,
`components/toast-host.tsx`, `components/edit/node-breadcrumb.tsx`,
`components/edit/node-tree.tsx`, `components/editor/Editor.tsx`,
`components/editor/Config.tsx`.

## Section 7 — Phasing (handed to writing-plans)

1. **Infra**: models folder conventions + relocate the already-simple types;
   stylesheet consolidation (§4a) — rename `fonts`/`theme` to `.scss`, merge the
   single Tailwind entry, update imports, drop `@tailwindcss/browser`, collapse
   tokens; `main.tsx`/`app.scss` stylesheet loading; add missing `.Dummy*`/
   `.D3Graph` scss blocks; rename `.Checkbox*` → `.sd-checkbox*`.
2. **Display components**: `SdText`, `SdCard`, `SdKpi`, `SdPageHeader`,
   `SdPane`, `SdBreadcrumb`, `SdToast`, `SdWave`, `SdWaveBar`, `SdWaveValue`,
   `SdGauge` + their consumers.
3. **Form components**: `SdButton`, `SdIconButton`, `SdInput`, `SdTextarea`,
   `SdSelect` + their consumers.
4. **Complex**: `SdTree` (+ `Editor.tsx`, `node-tree.tsx`, palette entry),
   `SdApplication` (+ `admin-layout.tsx`), `SdD3Graph`, `SdDummy` + helpers.
5. **Registry sweep** + final gates.

## Invariants

- `npm run check:components` is the mechanical gate: 23 conforming, 0 exempt
  (`SdSplitHandle` remains the documented `EXEMPT`). The checker is not weakened.
- No `Sd*.tsx` contains a comment, a Tailwind colour/typography utility, or a
  top-level non-contract prop.
- No `dark:` variants in `Sd*.tsx` (theme comes from `theme.css` tokens).
- Event payloads keep the `{ type, payload }` shape.
- Admin `--admin-*` tokens and editor chrome are untouched.

## Verification

- Per phase: `npm run typecheck` = 0; `npm run check:components` = OK; then
  `npm run build` = 0 at phase boundaries.
- Final: grep asserts no Tailwind colour/typography utilities and no comments in
  `Sd*.tsx`; `.sd-*`/`.Checkbox` rules present in the index CSS chunk; dashboard
  palette still renders each component and its `config.*` settings edit
  correctly; Playwright spot-check of `SdTree`, `SdButton`, `SdInput`,
  `SdCheckbox`, `SdToast` in both themes.
- Stylesheet gates: no `.css` file remains under `src/` except the single
  Tailwind entry; the index CSS chunk still contains `--tw-` and utilities
  after the merge; both themes render with no visual regression on the
  dashboard (Playwright style comparison before/after token collapse).

## Open decisions for review

1. **SCSS naming** — adopt `.sd-*` (prior spec) and rename `.Checkbox*`; keep or
   migrate legacy `.Pane`/`.Wave`/`.Gauge`/`.Tree*`.
2. **`SdIconName` / `SdWaveSource` placement** — move into `models/`, or let
   models import from `components/icons` and `routes/dashboard/store`.
3. **`SdTree` config granularity** — flat `SdTreeConfig` fields vs a nested
   `config.actions` map like `SdDummy`.
4. **Token reconciliation** (§4a) — accept the flagged dark-mode value shifts
   (`--border-color`, `--accent-color`, `--panel-background`, `--bg-code`,
   `--link-color`, `--input-bg`) when collapsing onto the vocabulary, or add
   dedicated vocabulary tokens to preserve every existing value exactly.
5. **Tailwind entry filename** — the merged single entry must stay `.css`; do we
   name it `globals.css` (current root import) or `tailwind.css`?
