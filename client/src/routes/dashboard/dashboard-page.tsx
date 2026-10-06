// import { Outlet } from "react-router";
// import Nav from "../../components/home/nav";

//import App from "../../../../vp1/src/App";

// export default function DashboardLayout() {
//   return (
//     <div className="flex flex-1 flex-col">
//       Dashboard Layout
//       <App />
//       {
//         /* <Nav />
//       <main className="flex flex-1 flex-col">
//         <Outlet />
//       </main> */
//       }
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
import { layouts, loadLayouts } from "../../../../vp1/src/layoutTree";
import type { Node } from "../../../../vp1/src/types";
import renderNode from "../../../../vp1/src/renderNode";
import {
  renderEditable,
  useDragDrop,
} from "../../../../vp1/src/editor/dragDrop";
import { useWaveStore } from "./store";
import Editor, {
  type EditorEvent,
} from "../../../../vp1/src/components/editor/Editor";
import Config from "../../../../vp1/src/components/editor/Config";
import SdSplitHandle, {
  HANDLE_WIDTH,
} from "../../../../vp1/src/components/SdSplitHandle";
import { useHistory } from "../../../../vp1/src/editor/History";
import {
  childrenOf,
  deleteNode,
  duplicateNode,
  ensureIds,
  findNode,
  isSelfOrDescendant,
  moveChild,
  moveNode,
  updateNode,
} from "../../../../vp1/src/editor/treeOps";
import {
  clearOverride,
  loadOverride,
  saveOverride,
} from "../../../../vp1/src/editor/storage";
import "../../stylesheets/tailwind.css";
import "../../stylesheets/app.scss";

const loadTreeFor = (name: string): Node => {
  const base = layouts[name];
  if (!base) throw new Error(`Unknown layout: ${name}`);
  const override = loadOverride(name);
  return ensureIds(override ?? base);
};

const MIN_PANEL_WIDTH = 120;
const DEFAULT_EDITOR_WIDTH = 200;
const DEFAULT_CONFIG_WIDTH = 250;

interface PanelWidths {
  editor: number;
  config: number;
}

const DashboardPage = () => {
  const [selectedLayout, setSelectedLayout] = useState<string>("");
  const [panels, setPanels] = useState<PanelWidths>({
    editor: DEFAULT_EDITOR_WIDTH,
    config: DEFAULT_CONFIG_WIDTH,
  });
  const rowRef = useRef<HTMLDivElement>(null);
  const { present: tree, setPresent, commit, undo, redo, canUndo, canRedo } =
    useHistory<Node | null>(null);
  const { start, stop, edit, toggleEdit } = useWaveStore();
  const { selectedId, select, editCtx, canvasProps, reset } = useDragDrop(
    tree,
    commit,
    edit,
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F8") {
        event.preventDefault();
        toggleEdit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleEdit]);

  useEffect(() => {
    if (!edit) reset();
  }, [edit, reset]);

  useEffect(() => {
    loadLayouts().then(() => {
      const names = Object.keys(layouts);
      if (names.length > 0) {
        const name = names[0];
        setSelectedLayout(name);
        setPresent(loadTreeFor(name));
        document.title = name;
      }
    });
  }, [setPresent]);

  useEffect(() => {
    const id = start();
    return () => stop(id);
  }, [start, stop]);

  useEffect(() => {
    if (tree && selectedLayout && layouts[selectedLayout]) {
      saveOverride(selectedLayout, tree);
    }
  }, [tree, selectedLayout]);

  const handleLayoutChange = (name: string) => {
    setSelectedLayout(name);
    setPresent(loadTreeFor(name));
    reset();
    document.title = name;
  };

  const selInfo = selectedId && tree ? findNode(tree, selectedId) : undefined;
  const selected = selInfo?.node ?? null;
  const parentChildren = selInfo?.parent
    ? childrenOf(selInfo.parent.children)
    : [];
  const canMoveUp = selInfo?.index !== undefined && selInfo.index > 0;
  const canMoveDown = selInfo?.index !== undefined &&
    selInfo.index < parentChildren.length - 1;

  const updateSelected = (patch: Partial<Node>) => {
    if (!tree || !selectedId) return;
    commit(updateNode(tree, selectedId, (n) => Object.assign(n, patch)));
  };

  const moveSelected = (dir: -1 | 1) => {
    if (
      !tree || !selInfo?.parent || selInfo.parent.id === undefined ||
      selInfo.index === undefined
    ) return;
    commit(moveChild(tree, selInfo.parent.id, selInfo.index, dir));
  };

  const duplicateSelected = () => {
    if (!tree || !selectedId) return;
    commit(duplicateNode(tree, selectedId));
  };

  const deleteSelected = () => {
    if (!tree || !selectedId) return;
    commit(deleteNode(tree, selectedId));
    select(undefined);
  };

  const moveNodeInTree = (
    dragId: string,
    target: { parentKey: string; index: number },
  ) => {
    if (!tree || dragId === target.parentKey) return;
    if (isSelfOrDescendant(tree, dragId, target.parentKey)) return;
    commit(moveNode(tree, dragId, target.parentKey, target.index));
  };

  const applySelectedJson = (parsed: Record<string, unknown>) => {
    if (!tree || !selectedId) return;
    commit(
      updateNode(
        tree,
        selectedId,
        (n) => Object.assign(n, parsed, { id: n.id }),
      ),
    );
  };

  const applyTreeJson = (json: string) => {
    if (!tree) return;
    try {
      const parsed = JSON.parse(json) as Node;
      commit(ensureIds(parsed));
    } catch {
      // invalid JSON: keep current tree
    }
  };

  const resetLayout = () => {
    if (!selectedLayout || !layouts[selectedLayout]) return;
    clearOverride(selectedLayout);
    const base = ensureIds(layouts[selectedLayout]);
    setPresent(base);
    reset();
  };

  const clampPanelWidth = (width: number, opposite: number) => {
    const row = rowRef.current?.clientWidth ?? window.innerWidth;
    const max = row - opposite - MIN_PANEL_WIDTH - 2 * HANDLE_WIDTH;
    return Math.round(Math.max(MIN_PANEL_WIDTH, Math.min(width, max)));
  };

  const setPanelWidths = (next: Partial<PanelWidths>) =>
    setPanels((prev) => {
      const editor = next.editor ?? prev.editor;
      const config = next.config ?? prev.config;
      const clamped = {
        editor: clampPanelWidth(editor, config),
        config: clampPanelWidth(config, editor),
      };
      return clamped.editor === prev.editor && clamped.config === prev.config
        ? prev
        : clamped;
    });

  // Keep the canvas usable when the window itself gets narrower.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(() => setPanelWidths({}));
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  const resizeEditor = (deltaX: number) =>
    setPanelWidths({ editor: panels.editor + deltaX });

  const resizeConfig = (deltaX: number) =>
    setPanelWidths({ config: panels.config + deltaX });

  const handleEditorEvent = (event: EditorEvent) => {
    switch (event.type) {
      case "layoutChange":
        handleLayoutChange(event.payload);
        break;
      case "selectNode":
        select(event.payload);
        break;
      case "moveNode":
        moveNodeInTree(event.payload.dragId, event.payload.target);
        break;
      case "undo":
        undo();
        break;
      case "redo":
        redo();
        break;
      case "resetLayout":
        resetLayout();
        break;
    }
  };

  return (
    <div ref={rowRef} className="flex w-full h-full min-h-0 flex-row">
      {edit && (
        <>
          <Editor
            onEvent={handleEditorEvent}
            selectedLayout={selectedLayout}
            style={{ width: panels.editor }}
            tree={tree}
            selectedId={selectedId}
            canUndo={canUndo}
            canRedo={canRedo}
          />
          <SdSplitHandle
            label="Resize editor panel"
            sign={1}
            onResize={resizeEditor}
            onReset={() => setPanelWidths({ editor: DEFAULT_EDITOR_WIDTH })}
          />
        </>
      )}
      <div
        className="flex min-w-0 w-full flex-1 flex-col overflow-auto"
        {...canvasProps}
      >
        {tree
          ? edit ? renderEditable(tree, "0", {}, editCtx) : renderNode(tree)
          : <p>Loading layouts...</p>}
      </div>
      {edit && tree && (
        <>
          <SdSplitHandle
            label="Resize config panel"
            sign={-1}
            onResize={resizeConfig}
            onReset={() => setPanelWidths({ config: DEFAULT_CONFIG_WIDTH })}
          />
          <Config
            tree={tree}
            selected={selected}
            style={{ width: panels.config }}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onMove={moveSelected}
            onDuplicate={duplicateSelected}
            onDelete={deleteSelected}
            onUpdate={updateSelected}
            onApplySelectedJson={applySelectedJson}
            onApplyTreeJson={applyTreeJson}
          />
        </>
      )}
    </div>
  );
};

export default DashboardPage;
