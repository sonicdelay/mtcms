# Plan: Port drag & drop from `ui-builder-pro` into `vp1`

## Goal

In **`vp1/`** (the app with Editor / center screen / Config panels): make palette
elements in the **Editor** panel draggable into the **center screen**, allow
selecting elements there, and make the **Config** panel edit the selected
element's data — updating the layout JSON that `renderNode` renders (live).

Source: `C:\localhost\mtcms\ui-builder-pro\` (standalone prototype; HTML5 DnD,
registry, tree utils, history — no npm package, hand-port the mechanics).

## Design decisions

1. **Keep vp1's `Node` JSON schema as source of truth** (`layoutTypes.ts`) —
   it's what boards JSON use and what `renderNode` renders. Do **not** switch
   to `NodeData { id, type, props, children[] }`. Add optional `id?: string`
   to `Node` for selection identity (assigned on load/drop, stripped never —
   harmless extra field).
2. **Reuse `renderNode`** with a new optional `edit` context param instead of a
   second renderer: when present, it injects per-node `onClick` /
   `onDragOver` / `onDrop` / `data-ed-id` and an `.ed-selected` class into the
   props passed to the component. Non-edit rendering stays unchanged.
3. **Prop forwarding**: `Sd*` components ignore unknown props today, so extend
   them to accept `...rest` and spread it onto their root DOM node
   (div/span). Native types (`div`, `h1`, `img`, `button`, `article`) already
   accept handler props. This avoids wrapper divs that would break the
   flex layouts.
4. **DnD mechanics** (from ui-builder-pro): palette `dragstart` sets
   `dataTransfer.setData('component-type', type)`; droppable nodes +
   center canvas implement `dragover` (preventDefault) + `drop` that inserts a
   new node with registry defaults. `stopPropagation` on droppable-child
   dragover/drop so only the deepest container receives the drop (fixes the
   double-insert that the prototype has).
5. **Selection**: click node (deepest wins, `stopPropagation`) → `selectedId`
   in App state → outline via `.ed-selected` → Config edits that node.
6. **Edits persist per layout in `localStorage`** (overlay on top of static
   `public/boards/*.json`), with a "Reset layout" action — boards are static
   files, so this is the only way changes survive reload. Undo/redo via
   ported `useHistory` (Ctrl+Z / Ctrl+Y).
7. **Edit-only**: all of this activates only when `edit` (F8) is on; view mode
   keeps the current plain `renderNode(tree)` path.

## File changes

### New files (under `vp1/src/editor/`)

| File | Contents |
|---|---|
| `registry.ts` | Palette descriptors ported from ui-builder-pro `Registry.tsx` shape: `{ type, title, droppable?, defaultProps(), settings? }`. Items = vp1 reality: `SdPane` (droppable), `SdWave`, `SdWaveValue`, `SdWaveBar`, `SdGauge`, `SdText`, `SdButton`, `div`/`article` (droppable), `h1`, `img`, `button`. `droppable` fallback at runtime: node has `children` array. |
| `treeOps.ts` | Port of ui-builder-pro `utils.ts` adapted to single-root vp1 `Node`: `findNode(root,id)`, `updateNode`, `insertChild` (normalizes `children`: `undefined→[]`, `string→[string]`, then append), `deleteNode`, `moveChild` (up/down), `ensureIds` (backfill missing ids), `createNode(type)` from registry defaults. |
| `History.ts` | Direct port of ui-builder-pro `History.ts` (`useHistory` + Ctrl+Z/Y). |
| `storage.ts` | localStorage overlay: key `vp1_layout_overrides_v1` → `{ [layoutName]: Node }`; `loadOverride(name)`, `saveOverride(name, tree)`, `clearOverride(name)`. |

### Modified files

| File | Change |
|---|---|
| `src/layoutTypes.ts` | Add `id?: string` to `Node`. |
| `src/renderNode.tsx` | Add optional `edit?: EditContext` param. Per object node: merge `onClick` (select + stopPropagation), and for droppable nodes `onDragOver` (preventDefault + stopPropagation + add `.ed-drop-target` to `currentTarget`) / `onDrop` (insert via registry + stopPropagation + commit) / `dragleave` cleanup; append `.ed-selected` to `className` when selected. String children unchanged. |
| `src/App.tsx` | Tree state → `useHistory<Node>`; on layout load: `ensureIds` + apply localStorage override; `selectedId` state; root-canvas `onDragOver`/`onDrop` (append to root children) + click-to-deselect; pass `EditContext` to `renderNode` when `edit`; `commit` also saves override; undo/redo buttons stay in Editor panel. |
| `src/components/editor/Editor.tsx` | Replace cosmetic `componentList` with registry-driven palette `<li draggable onDragStart={…setData('component-type')}>` (keep existing `li[draggable]` SCSS); add Undo/Redo/Reset-layout buttons; keep layout `<select>` + action-handler debug UI. |
| `src/components/editor/Config.tsx` | Property editor for selected node: type label; per-type fields from registry `settings`/common (`title`, `source` select sin/cos/tan/data.*, `min`/`max`, `data` (button label), `src`/`alt` (img), text `children` textarea when `children` is string); existing className textarea now bound (writes `className` on change); Move up/down, Duplicate, Delete buttons; raw-JSON textarea of selected node with Apply (validation + `id` preserved). When nothing selected: full screen JSON textarea of `tree` with Apply (this is the "change the json data used to render the screen" escape hatch). |
| `src/components/SdPane.tsx`, `SdWave.tsx`, `SdWaveBar.tsx`, `SdWaveValue.tsx`, `SdGauge.tsx`, `SdText.tsx`, `SdButton.tsx` | Accept rest props (`[key: string]: unknown` / spread `...rest` onto root div/span) so injected handlers/`data-ed-id` reach the DOM. No behavior change otherwise. |
| `src/stylesheets/components.scss` | `.ed-selected { outline: 2px solid #4a90e2; outline-offset: 2px; }`, `.ed-drop-target { outline: 2px dashed #4ade80; }`, small styles for Config field rows; keep existing palette `li[draggable]` styles. |

## Drop flow (runtime)

1. `dragstart` on palette item → `dataTransfer: component-type = "SdGauge"` etc.
2. Hover center: deepest droppable node's `dragover` is canceled → it becomes
   the drop target; `.ed-drop-target` outline shown.
3. `drop` → `createNode(type)` → `insertChild` into that node (or root) →
   `history.commit(next)` → localStorage save → React re-renders
   `renderNode` with the new JSON → element appears live in the center.
4. Click it → `selectedId` → Config shows fields → edits call
   `updateNode` → `commit` → re-render shows changed screen.

## Out of scope

- Mouse-drag reposition/resize of absolute-positioned nodes (ui-builder-pro
  feature not requested).
- Server/CMS (`client/`, `server/`) — untouched.
- Saving back to `public/boards/*.json` files (static; localStorage overlay
  instead).
- Reordering by dragging existing elements (Move up/down buttons instead).

## Verification

1. `npx tsc --noEmit` in `vp1/` (no typecheck script exists).
2. `npm run build` in `vp1/` (Vite production build).
3. `npm run dev` + Playwright smoke test: F8 → drag `SdGauge` from palette
   onto center → element appears; click it → Config edits title/source →
   center updates; reload → override persisted; Reset layout → original JSON.
