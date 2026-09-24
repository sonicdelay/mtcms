import { useEffect, useState } from "react";
import { layouts, loadLayouts } from "./layoutTree";
import type { Node } from "./layoutTypes";
import renderNode from "./renderNode";
import { renderEditable, useDragDrop } from "./editor/dragDrop";
import { useWaveStore } from "./store";
import Editor from "./components/editor/Editor";
import Config from "./components/editor/Config";
import { useHistory } from "./editor/History";
import {
  childrenOf,
  deleteNode,
  duplicateNode,
  ensureIds,
  findNode,
  moveChild,
  updateNode,
} from "./editor/treeOps";
import { clearOverride, loadOverride, saveOverride } from "./editor/storage";
import "./stylesheets/app.scss";

function loadTreeFor(name: string): Node {
  const base = layouts[name];
  if (!base) throw new Error(`Unknown layout: ${name}`);
  const override = loadOverride(name);
  return ensureIds(override ?? base);
}

export default function App() {
  const [selectedLayout, setSelectedLayout] = useState<string>("");
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
  const canMoveDown =
    selInfo?.index !== undefined && selInfo.index < parentChildren.length - 1;

  const updateSelected = (patch: Partial<Node>) => {
    if (!tree || !selectedId) return;
    commit(updateNode(tree, selectedId, (n) => Object.assign(n, patch)));
  };

  const moveSelected = (dir: -1 | 1) => {
    if (!tree || !selInfo?.parent || selInfo.parent.id === undefined || selInfo.index === undefined) return;
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

  const applySelectedJson = (parsed: Record<string, unknown>) => {
    if (!tree || !selectedId) return;
    commit(
      updateNode(tree, selectedId, (n) => Object.assign(n, parsed, { id: n.id }))
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

  return (
    <div className="flex w-full h-full min-h-0 flex-row">
      {edit && (
        <Editor
          selectedLayout={selectedLayout}
          onLayoutChange={handleLayoutChange}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onResetLayout={resetLayout}
        />
      )}
      <div
        className="flex min-w-0 w-full flex-1 flex-col overflow-auto"
        {...canvasProps}
      >
        {tree
          ? edit
            ? renderEditable(tree, "0", {}, editCtx)
            : renderNode(tree)
          : <p>Loading layouts...</p>}
      </div>
      {edit && tree && (
        <Config
          tree={tree}
          selected={selected}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMove={moveSelected}
          onDuplicate={duplicateSelected}
          onDelete={deleteSelected}
          onUpdate={updateSelected}
          onApplySelectedJson={applySelectedJson}
          onApplyTreeJson={applyTreeJson}
        />
      )}
    </div>
  );
}