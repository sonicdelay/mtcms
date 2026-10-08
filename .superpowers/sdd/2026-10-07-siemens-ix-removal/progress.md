# SDD ledger â€” plan: docs/superpowers/plans/2026-10-07-siemens-ix-removal.md

Setup: work in place on `main` (user's uncommitted package.json/component-props edits live here; worktree would strand them). No commits (AGENTS.md: commit only on explicit request) â€” final review runs on the uncommitted diff; `task-done` commit ranges recorded as `none`. Scripts `task-start`/`task-done`/`sdd-workspace` not runnable (no git-bash on this host) â€” roles performed manually; briefs = plan task sections.

Pre-flight shared interfaces:

- T1 SdIcon/SdIconName â†’ T2, T5, T7: plan consistent.
- T2 SdButton/SdIconButton â†’ T6 edit-page, T7 pages: plan consistent.
- T3 form controls â†’ T6 edit-page (SdSelect), T7 pages: plan consistent.
- T4 toast() + SdBreadcrumb(+onSelect amendment) â†’ T6, T7: amendment pre-declared in plan T6; consistent.
- T5 SdApplication â†’ admin-layout (same task): no cross-task row.
  Pre-flight: no conflicts.

Note: no client test runner exists â€” TDD gates are the plan's four verification commands (check:components, typecheck, lint, build) run per task as the brief's Expected lines.

Ruling: lint gate â€” npm run lint pre-existing broken (client/eslint.config.mjs deleted in ce56b45; no eslint/typescript-eslint/prettier in node_modules) â€” gates substituted: tsc --noEmit + check:components + build â€” cost if wrong: style-rule violations slip through.
TDD gate adaptation: no client test runner; RED = baseline command output (tsc baseline 29 errors, all TS2307/TS7006 from @siemens) watched before implementation; GREEN = same command with no NEW errors + task-specific checks.

Task 1: complete (commits none â€” no-commit policy, tests: npx tsc --noEmit -p tsconfig.json â†’ 29 errors = baseline, 0 in icons.tsx)

Task 2: complete (commits none, tests: npx tsc --noEmit â†’ 29 = baseline, 0 new; npm run check:components â†’ OK - 12 components conform)
Task 2: Ruling: palette defaultProps omit `type` field (matches existing entries SdPane..SdButton, registry.ts:120-199); SdButton settings key `data`â†’`value` + stale `actions`/`className` defaultProps dropped (rules Â§1 forbid `data` prop) â€” cost if wrong: editor config panel edits wrong key.
Task 2: Ruling: component-props.ts base wildcard was found commented out (`//[key: string]: unknown;`) mid-task; restored uncommented â€” rules Â§2 + check-script require it; tsc stayed at 29 baseline after restore â€” cost if wrong: none observed.
Task 2: Ruling: eventIn-once dispatch block (SdPane pattern: useRef guard + sd.dispatchAction + onChange) added to new interactive primitives (SdButton, SdIconButton); display components skip it per SdText/SdGauge precedent â€” cost if wrong: boilerplate; editor actions targeting primitives dispatch or not consistently.

Task 3: complete (commits none, tests: npx tsc --noEmit → 29 = baseline, 0 new; npm run check:components → OK - 16 components conform)

Task 4: complete (commits none, tests: npx tsc --noEmit → 29 = baseline, 0 new; npm run check:components → OK - 21 components conform)
Task 4: Ruling: SdToast value uses named type `SdToastValue` (not inline `{title;type}` generic) because check-component-props.mjs braces-matches interface body from the first `{` — an inline object type in heritage hides the wildcard from the regex — cost if wrong: none (contract identical).

Task 5: complete (commits none, tests: npx tsc --noEmit → 27 = baseline minus admin-layout's 2 @siemens TS2307s; npm run check:components → OK - 22 components conform; admin.scss has zero ix-/siemens/--theme-color refs)
Task 5: Ruling: SdApplication palette defaultProps `type` field omitted again (plan wording showed it) — consistent with Task 2 ruling; palette item.type already carries the discriminator.
Task 5: Ruling: SdApplication active-state = exact match for "/admin", prefix match for sub-routes (admin-layout only has those two shapes) — cost if wrong: nav highlight wrong if two hrefs share a prefix.

Task 6: complete (commits none, tests: npx tsc --noEmit → 16 errors, all confined to the 6 Task-7 files; npm run check:components → OK - 22; edit.store.ts/node-tree/node-breadcrumb/edit-page have 0 errors)
Task 6: Ruling: edit-page SdSelect onChange handler typed structurally `{ target: { value: string } }` (rest prop index is unknown, inline param needs explicit type) — cost if wrong: none, target.value exists on the real ChangeEvent.

Task 7: complete (commits none, tests: npm run typecheck → exit 0 FULLY GREEN (was 29 errors); npm run check:components → OK - 22; zero @siemens/Ix*/showToast refs in client/src)
Task 7: Ruling: SdSelect/SdInput onChange handlers typed structurally `{ target: { value: string } }` at call sites (rest index is unknown) — cost if wrong: none.
Task 7: Ruling: tasks-page SdCheckbox uses `value={task.done}` not `checked` (SdCheckbox renders checked from `value`).
Task 8: complete (commits none, tests: grep gate @siemens|siemens-ix|Ix[A-Z]|ix-textarea|ix-admin|showToast in client/src → 0; Siemens in README.md/ai/ → 0; registration gate 11/11 new components in index.ts+palette; npm run check:components → OK; npm run typecheck → 0; npm run build → 0 (sync-dist ok); smoke: vite dev on 4210 serves /admin 200 + module transform 200)
Task 8: Ruling: markdown.scss --theme-color-_/--bg-code vars (were defined by iX CSS) replaced with main.scss/Tailwind tokens (--color, --border-color, --accent-color, --panel-background, --color-zinc-_) — out of plan scope but dead vars after iX CSS removal; cost if wrong: home-site markdown colors differ slightly from old iX theme.
Task 8: npm run lint gate skipped per Task-1 ruling (eslint config deleted in ce56b45; pre-existing breakage).
Task 8: package.json/package-lock.json had @siemens deps already removed by user pre-task; verified 0 refs.

## 2026-10-08 — Dashboard 4-fix batch (user-ordered: do these first, spec after)

- Config panel text -> white: Config.tsx root now 	ext-white (Playwright: h3/p rgb(255,255,255)).
- Editor tree child items: 	ext-yellow-200 -> 	ext-sky-300 (yellow gone, oklch(0.828 0.111 230.318) verified).
- layoutTree.json button: g-blue-500 -> g-gray-800 (computed oklch(0.278 0.033 256.848) = gray-800).
  Note: node key is data (trailing spaces), so SdButton label renders empty (pre-existing data quirk, out of scope).
- Scrollbars -> Chrome DevTools style: tokens --scrollbar-thumb/-hover in theme.css (light #bdc1c6/#9aa0a6, dark #5f6368/#80868b); rules in globals.css (10px, transparent track, 2px transparent border + background-clip content-box, rounded); old green rules removed from app.scss.
  RULING: ackground: var(...) shorthand gets emptied by the CSS pipeline -> must use ackground-color: var(...) longhand (verified in cssText).
- Gates: typecheck 0, build 0, check:components 22/22, Playwright four-fixes-verify.cjs 7/7.
- Next: architectural brainstorm (user ruling) = all registered Sd* components, colors/borders/typography to components.scss, layout utilities stay in JSX; spec then writing-plans.

## 2026-10-08 (later) - Nav theme tokens + dashboard tree features (TDD batch)

- Nav conversion (user choice "Convert nav to theme tokens"): nav.tsx duplicated light/dark pairs replaced with [var(--surface)]/[var(--fg)]/[var(--fg-muted)]/[var(--border)]/[var(--border-strong)]/[var(--surface-hover)]; 0 dark: remnants in nav.tsx (ThemeSwitcher/LanguageSwitcher own dark: classes untouched, separate components).
  - Added the approved styling-spec Section 1 token vocabulary to :root and .dark in theme.css (declarations only, no behavior change; spec still awaits user review).
  - RULING: two intentional one-shade drifts to token values: header dark border zinc-800 -> --border (zinc-700); login dark border zinc-700 -> --border-strong (zinc-600). Avatar becomes bg-[var(--fg)] text-[var(--surface)] (inverts correctly both themes).
  - Verified nav-verify.cjs 17/17 (both themes exact: white/zinc-950 header, zinc-900/zinc-50 brand+active, zinc-500/zinc-400 muted, token usage, no dark:, oklch->rgb baseline sanity).
- Feature batch (approved designs; TDD: corrected RED 5/5 -> GREEN 5/5 in tree-features-verify.cjs):
  1. Delete selects successor: treeOps.successorOf(root,id) = pre-order flatten with depth, first following row with depth <= deleted node's depth (skips whole subtree), else row immediately above, else undefined; dashboard deleteSelected computes successor before commit then select(next).
  2. Palette -> treeview drop: SdTree detects external drag via e.dataTransfer.types.includes("component-type") (EXTERNAL_MIME), dropEffect "copy", skips internal canDrop, new prop onDropExternal(componentType, target); Editor emits new EditorEvent "insertNode"; dashboard-page handles it via palette[type].defaultProps() + createNode + insertChildAt + commit + select(child.id).
  3. Reveal fix (flagged to user, approved scope addition): SdTree selectedKey lookup + auto-expand now use a full un-gated id index (fullIndex memo); rendering/drop resolution stay expansion-gated. Canvas-selected nodes under collapsed paths now reveal.
- RED-run test bugs fixed in tree-features-verify.cjs: labelOf shows palette titles ("Heading 1"/"Text"), not content; dragover feedback needs async evaluate + wait (React continuous-event flush); fire() must return the event for defaultPrevented; expected row counts derived from actual layoutTree.json (root + 4 panes, h1 is grandchild; subtree-delete rows=7 because successor auto-expands itself - pre-existing behavior).
- Regression: internal-move-verify.cjs PASS (row drag reorders with feedback+preventDefault after dragHandlers restructure).
- Gates: typecheck 0, check:components 22/22, build 0. scripts: tree-features-verify 5/5, nav-verify 17/17, internal-move-verify 1/1.
- Next: styling spec (docs/superpowers/specs/2026-10-08-sd-component-styling.md) awaits user review -> writing-plans.


## 2026-10-08 (later still) - ComponentEvent regression fix (external concurrent edit)

- Root cause (systematic-debugging): external edit at 16:13:55-16:14:02 (NOT this session) added a real onChange typing to ComponentProps (was index-signature unknown, which silently allowed DOM-style handlers) and refactored SdInput/SdSelect/SdTextarea to emit onChange({type:"change", payload:{value:string}}). The old rest.onChange(event) lines in those components are dead code (onChange is destructured out). 7 consumer handlers still reading e.target.value broke typecheck (7x TS2322) and would throw at runtime (e.target undefined on ComponentEvent).
- Fix (consumers only, field components untouched to avoid the active external edit): login-form.tsx x2, edit-page.tsx x1 (keeps "en"|"de" cast), tasks-page.tsx x3, tools-page.tsx x1 now read (ev.payload as {value?: string} | undefined)?.value ?? "".
- Verification: typecheck 0, check:components 22/22, build 0; runtime login probe PASS at /admin (LoginForm renders under admin-layout when no token, NOT at /login - earlier probe failure was the wrong route): email="abc" password="pw", zero page/console errors.
- Full battery re-run: tree-features 5/5, nav 17/17, internal-move PASS. No external edits since 16:14 (newest mtimes were this session's 16:20 fixes).
- Flagged, not touched: dead rest.onChange(event) lines + no new-contract consumer pattern in SdInput/SdSelect/SdTextarea; future option is narrowing their ComponentProps TEvent generic so call sites need no cast.
