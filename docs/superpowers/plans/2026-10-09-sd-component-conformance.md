# Sd* component conformance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conform every Sd* component (except SdSplitHandle) to contract-only props using SdComponentProps, move all setup to config, strip comments, remove Tailwind color/typography from JSX, relocate types to client/src/models/*, add SdTree to registry, fix stylesheet loading, and consolidate stylesheets.

**Architecture:** Incremental rework in phases with mechanical gates (npm run typecheck, npm run check:components, npm run build) after each phase. SdSplitHandle remains exempt. Stylesheet loading moves components.scss import to main.tsx; fonts/theme renamed to .scss; single Tailwind entry stays globals.css. Models define SdIconName and SdWaveSource types and are imported by components.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS 4 + Sass-embedded (client), Deno + Express (server — unchanged). 

**Spec:** docs/superpowers/specs/2026-10-09-sd-component-conformance.md

## Global Constraints

- Repo root: /home/sascha/localhost/mtcms; client commands from client/
- NEVER commit unless explicitly asked
- opencode.jsonc permissions: edit deny for .env and ai/rules/**/*.md; bash npm run * ask, npx * ask, node * ask
- Components: Sd*-prefixed, no comments, only optional props value/config/onChange/eventIn/children/className, use SdComponentProps exclusively (no own members), events {type,payload}, config holds setup, no Tailwind color/typography utilities in JSX, structural utilities allowed
- check:components detects SdComponentProps, EXEMPT = SdSplitHandle.tsx; checker must not be weakened
- eslint not installed in client (npm run lint may fail)
- Build: npm run build = vite build && node scripts/sync-dist.mjs

## Review Focus

- **Incoming event identity:** Same SdComponentEvent object must not reprocess on re-renders — must use useRef identity guard (affects all components that react to eventIn)
- **DOM prop leakage:** Consumed props (value/config/eventIn/onChange/children/className) must be destructured out so they never reach DOM elements (prevents React warnings and preserves checker contract)
- **Config-only API:** All non-contract props moved to config; registry settings use config.* dot paths; consumers pass config object
- **Stylesheet availability:** components.scss must load for all pages that render Sd* (moved to main.tsx) — otherwise SdCheckbox/Sd* styles missing in non-dashboard contexts
- **Tailwind entry integrity:** globals.css (merged single entry) must keep @source directives and still emit utilities in index CSS chunk (--tw- present)

---

### Task 1: Infra — models, stylesheet consolidation, base loading, SCSS naming

**Files:**
- Modify: client/src/main.tsx, client/src/vite-env.d.ts, client/src/stylesheets/app.scss, client/src/stylesheets/globals.css, client/src/stylesheets/fonts.css (→ rename), client/src/stylesheets/theme.css (→ rename), client/src/stylesheets/components.scss, client/src/routes/dashboard/dashboard-page.tsx
- Create: client/src/models/sd-icon.ts (or sd-icons.ts), extend client/src/models/sd-wave.ts to export SdWaveSource, client/src/models/sd-icon-button.ts? (already may exist) — see mapping
- Delete: client/scripts/check-component-props.mjs? (no change except ensure still OK) — no delete
- Rename: fonts.css→fonts.scss, theme.css→theme.scss

**Interfaces:**
- Produces: SdIconName (models), SdWaveSource (models, exported from sd-wave.ts), single Tailwind entry globals.css merged with @sources, components.scss imported from main.tsx

- [ ] **Step 1: Create model files for shared types (SdIconName, SdWaveSource)**

Write models:
- client/src/models/sd-icon.ts: export type SdIconName = keyof typeof iconMap (or import from components/icons). Since models may import from components/icons to keep single source, create sd-icon.ts that re-exports or defines by importing iconMap. Keep boundary: components import from models.
  Also update SdIconButton to import SdIconName from models.

- [ ] **Step 2: Extend sd-wave.ts to export SdWaveSource**

Add export type SdWaveSource = DeepKeys<WaveState> (import DeepKeys from dashboard store type? Or define minimal). Prefer moving type to models: import type { WaveState } from "../routes/dashboard/store" only if acceptable; alternatively extract to models/shared. Follow decision 2.

- [ ] **Step 3: Merge Tailwind entry into globals.css (keep .css)**

Merge client/src/stylesheets/tailwind.css @sources into client/src/stylesheets/globals.css (after @custom-variant or before @theme). Sources: ../../index.html, ../**/*.{ts,tsx}, ../../public/boards/*.json. Remove runtime @tailwindcss/browser import from main.tsx and module declaration from vite-env.d.ts.

- [ ] **Step 4: Rename pure-CSS to .scss and update imports**

Rename fonts.css→fonts.scss, theme.css→theme.scss. Update imports: main.tsx imports ./stylesheets/fonts.scss and ./stylesheets/globals.css (and ./stylesheets/components.scss added). globals.css imports ./theme.scss. Update any other references.

- [ ] **Step 5: Move components.scss import to main.tsx; clean app.scss**

In main.tsx add import "./stylesheets/components.scss" after fonts/globals. In app.scss remove @use './components.scss'. Delete dead/commented CSS in app.scss/main.scss.

- [ ] **Step 6: Token collapse in theme.scss (accept shifts)**

Unify tokens to vocabulary (bg, fg, surface*, border*, focus, accent*, danger*, success, overlay). Preserve values with dark shifts as per decision 4. Remove duplicate font-family rules; ensure body uses var(--font-sans).

- [ ] **Step 7: SCSS naming setup**

In components.scss add base .sd-* blocks for Checkbox→sd-checkbox (rename existing .Checkbox*), and add missing .Dummy, .Dummy-children, .Dummy-value, .D3Graph minimal rules. Keep legacy .Pane/.Wave/.Gauge/.Tree* intact.

- [ ] **Step 8: Infra gate**

Run: cd client && npx tsc --noEmit -p tsconfig.json
Run: cd client && node scripts/check-component-props.mjs
Run: cd client && npx vite build

Expected: typecheck OK, check OK (23 conforming, 1 exempt SdSplitHandle), build OK. Index CSS must contain --tw- and utilities.

### Task 2: Display components

**Files:**
- Modify: client/src/components/SdText.tsx, SdCard.tsx, SdKpi.tsx, SdPageHeader.tsx, SdPane.tsx, SdBreadcrumb.tsx, SdToast.tsx, SdWave.tsx, SdWaveBar.tsx, SdWaveValue.tsx, SdGauge.tsx
- Create: client/src/models/sd-text.ts, sd-card.ts (maybe none), sd-kpi.ts, sd-page-header.ts, sd-breadcrumb.ts, sd-toast.ts, sd-wave.ts (extend), sd-gauge.ts
- Consumers: routes/admin/dashboard-page.tsx, tools-page.tsx, files-page.tsx, edit-page.tsx, tasks-page.tsx, components/toast-host.tsx, components/edit/node-breadcrumb.tsx

**Interfaces:**
- All use SdComponentProps exclusively; config contains moved props; DOM props never spread consumed props.

- [ ] **Step 1: SdText** — model sd-text.ts (SdTextConfig). Component: props interface only wildcard, DEFAULT_CONFIG, useRef event guard, destructure consumed, className ["sd-text", rest.className]. Strip comments. No Tailwind color/typography.
- [ ] **Step 2: SdCard** — no config model (per spec). SdComponentProps<unknown> direct. Strip comments, sd-card root class.
- [ ] **Step 3: SdKpi** — sd-kpi.ts (SdKpiConfig). Move label to config.
- [ ] **Step 4: SdPageHeader** — sd-page-header.ts (SdPageHeaderConfig). Move subtitle to config.
- [ ] **Step 5: SdPane** — no config model. SdComponentProps<unknown>.
- [ ] **Step 6: SdBreadcrumb** — sd-breadcrumb.ts (SdBreadcrumbItem, SdBreadcrumbValue, SdBreadcrumbConfig). Move onSelect to config.
- [ ] **Step 7: SdToast** — sd-toast.ts (SdToastValue, SdToastConfig). Move onDismiss to config; event guard + onChange forwarding.
- [ ] **Step 8: SdWave/SdWaveBar/SdWaveValue** — extend sd-wave.ts with configs and SdWaveSource export. Move title/source to config. Fix DOM spread (destructure consumed). sd-wave* classes.
- [ ] **Step 9: SdGauge** — sd-gauge.ts (SdGaugeConfig imports SdWaveSource). Move title/source/min/max to config.
- [ ] **Step 10: Update display consumers** — pass config objects, use config.*; no top-level moved props.
- [ ] **Step 11: Display components gate**

Run typecheck, check:components, build. All 23 conforming.

### Task 3: Form components

**Files:**
- Modify: client/src/components/SdButton.tsx, SdIconButton.tsx, SdInput.tsx, SdTextarea.tsx, SdSelect.tsx, SdCheckbox.tsx (already mostly OK; align to sd-* naming/classes)
- Create: client/src/models/sd-button.ts, sd-icon-button.ts, sd-input.ts, sd-textarea.ts, sd-select.ts (SdSelectOption)
- Consumers: login-form.tsx, file-editor-dialog.tsx, admin/edit-page.tsx, admin/tasks-page.tsx, admin/files-page.tsx, admin/tools-page.tsx, admin/edit-page.tsx

**Interfaces:**
- Config carries variant/icon/disabled/type/label/placeholder/required/options/rows etc.

- [ ] **Step 1: SdButton** — sd-button.ts (SdButtonVariant, SdButtonConfig). Move all extra props to config. Strip comments. sd-button root + modifiers via config.
- [ ] **Step 2: SdIconButton** — import SdIconName from models/sd-icon.ts. sd-icon-button root.
- [ ] **Step 3: SdInput** — sd-input.ts (SdInputConfig).
- [ ] **Step 4: SdTextarea** — sd-textarea.ts.
- [ ] **Step 5: SdSelect** — sd-select.ts (SdSelectOption, SdSelectConfig).
- [ ] **Step 6: SdCheckbox** — ensure uses sd-checkbox classes (rename Checkbox*→sd-checkbox*), model folded to sd-checkbox.ts (SdCheckboxConfig). Strip comments if any.
- [ ] **Step 7: Update form consumers** — use config API.
- [ ] **Step 8: Form components gate**

Run typecheck, check:components, build.

### Task 4: Complex components

**Files:**
- Modify: client/src/components/SdTree.tsx, SdApplication.tsx, SdD3Graph.tsx, SdDummy.tsx, SdDummyContainerComponent.tsx, SdDummyLeafComponent.tsx
- Create: client/src/models/sd-tree.ts, sd-application.ts, sd-d3-graph.ts, sd-dummy.ts
- Consumers: components/editor/Editor.tsx, components/edit/node-tree.tsx, routes/admin/admin-layout.tsx, registry.ts (palette)

**Interfaces:**
- SdTree: flat config per spec (renderIcon, selectedId, onSelect, defaultExpandedIds, onMove, onDropExternal, canDropInside). Tree types (TreeItem, TreeItemState, TreeItemTemplate, TreeDropPosition, TreeDropTarget) in sd-tree.ts.
- SdApplication: navItems/SdApplicationNavItem in sd-application.ts; config carries brand/navItems/activeHref/user/theme/onToggleTheme/onNavigate/onLogout.
- SdD3Graph: domain types in sd-d3-graph.ts.
- SdDummy: types in sd-dummy.ts; helpers compliant but not palette items.

- [ ] **Step 1: SdTree** — sd-tree.ts with all tree types + SdTreeConfig (flat). Move extra props to config. Fix DOM spread. Add .sd-tree classes in components.scss (and keep legacy .Tree* if present).
- [ ] **Step 2: SdApplication** — sd-application.ts (SdApplicationNavItem renamed from SdNavNavItem conceptually, export as SdApplicationNavItem). Config holds all extra props.
- [ ] **Step 3: SdD3Graph** — sd-d3-graph.ts (SdD3GraphPoint, SdD3GraphValue, SdD3GraphConfig). Move props to config; add .D3Graph rules.
- [ ] **Step 4: SdDummy + helpers** — sd-dummy.ts. Make all compliant (SdComponentProps, event guard, no comments). Add .Dummy* rules. Not palette items.
- [ ] **Step 5: Update complex consumers** — Editor.tsx, node-tree.tsx, admin-layout.tsx.
- [ ] **Step 6: Complex components gate**

Run typecheck, check:components, build.

### Task 5: Registry sweep + final gates

**Files:**
- Modify: client/src/routes/dashboard/registry.ts (palette), client/src/components/index.ts (component registry), client/src/components/editor/Config.tsx if needed
- Add: palette entry for SdTree (flat config, sample value)

**Interfaces:**
- Every palette item defaultProps returns {value, config}; settings use dot paths config.*. Add SdTree entry as specified.

- [ ] **Step 1: Update dashboard registry defaultProps/settings**

Rewrite all moved props to config.* keys. Ensure {value, config} shapes. Add SdTree entry per spec.
- [ ] **Step 2: Components index — ensure all Sd* exported correctly**

No structural changes; verify SdSplitHandle not modified.
- [ ] **Step 3: Config.tsx dot-path support (verify)**

Already supports readPath/writePath; ensure nested merge behavior unchanged.
- [ ] **Step 4: Global grep verification**

Verify no Tailwind color/typography utilities in Sd*.tsx (e.g. bg-*, text-*, border-* color tokens except structural). Verify no comments in Sd*.tsx. Verify no top-level non-contract props in Sd*.tsx.
- [ ] **Step 5: Final gates**

Run: cd client && npx tsc --noEmit -p tsconfig.json
Run: cd client && node scripts/check-component-props.mjs (expect 23 conforming, 1 exempt)
Run: cd client && npx vite build
- [ ] **Step 6: Verify CSS artifacts**

Check index CSS chunk contains --tw- and utilities; .sd-* classes present (sd-checkbox, sd-text, sd-button, sd-tree, sd-application, sd-d3graph/dummy classes) in built CSS.

**Expected:** All gates pass. Do NOT commit.

## Verification Commands (reference)

```bash
cd client
npx tsc --noEmit -p tsconfig.json
node scripts/check-component-props.mjs
npx vite build
# Greps (post-implementation)
grep -rn "bg-\|text-\|border-gray\|dark:" src/components/Sd*.tsx
grep -rn "^ *//" src/components/Sd*.tsx
grep -rn "export interface Sd[A-Z][a-zA-Z]*Props" src/components/Sd*.tsx | wc -l
```

## Notes

- SdSplitHandle.tsx is exempt (EXEMPT in check script). Do not modify.
- SdDummyContainerComponent/SdDummyLeafComponent become compliant but not palette items.
- R6: stylesheet consolidation done in Task 1. Tailwind entry stays globals.css.
- Decisions applied: sd-* naming, models import for SdIconName/SdWaveSource, flat SdTree config, token collapse with shifts, globals.css as single Tailwind entry.
