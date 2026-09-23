import { useCallback, useEffect, useState } from "react";
import type { DragEvent } from "react";
import { layouts, loadLayouts } from "./layoutTree";
import type { Node } from "./layoutTypes";
import renderNode from "./renderNode";
import type { EditContext } from "./renderNode";
import { useWaveStore } from "./store";
import Editor from "./components/editor/Editor";
import Config from "./components/editor/Config";
import { useHistory } from "./editor/History";
import { isDroppable, palette } from "./editor/registry";
import {
  childrenOf,
  createNode,
  deleteNode,
  duplicateNode,
  ensureIds,
  findNode,
  insertChild,
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
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [dropTargetId, setDropTargetId] = useState<string | undefined>(undefined);
  const { present: tree, setPresent, commit, undo, redo, canUndo, canRedo } =
    useHistory<Node | null>(null);
  const { start, stop, edit } = useWaveStore();

  useEffect(() => {
    const clearDropTarget = () => setDropTargetId(undefined);
    document.addEventListener("drop", clearDropTarget);
    document.addEventListener("dragend", clearDropTarget, true);
    return () => {
      document.removeEventListener("drop", clearDropTarget);
      document.removeEventListener("dragend", clearDropTarget, true);
    };
  }, []);

  useEffect(() => {
    loadLayouts().then(() => {
      const names = Object.keys(layouts);
      if (names.length > 0) {
        const name = names[0];
        setSelectedLayout(name);
        setPresent(loadTreeFor(name));
        setSelectedId(undefined);
        setDropTargetId(undefined);
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
    setSelectedId(undefined);
    setDropTargetId(undefined);
    document.title = name;
  };

  const select = useCallback((id?: string) => setSelectedId(id), []);

  const insertNode = useCallback(
    (parentId: string, e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDropTargetId(undefined);
      if (!tree) return;
      const type = e.dataTransfer.getData("component-type");
      const item = palette[type];
      if (!item) return;
      const child = createNode(type, item.defaultProps());
      const next = insertChild(tree, parentId, child);
      commit(next);
    },
    [tree, commit]
  );

  const setDropTarget = useCallback((id?: string) => {
    setDropTargetId((prev) => (prev === id ? prev : id));
  }, []);

  const droppable = useCallback((node: Node) => isDroppable(node), []);

  const editCtx: EditContext = {
    selectedId,
    select,
    isDroppable: droppable,
    insertNode,
    dropTargetId,
    setDropTarget,
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
    setSelectedId(undefined);
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
    setSelectedId(undefined);
    setDropTargetId(undefined);
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
        onClick={() => select(undefined)}
        onDragOver={
          edit && tree
            ? (e) => {
                e.preventDefault();
                setDropTarget(tree.id);
              }
            : undefined
        }
        onDragLeave={
          edit
            ? (e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Element | null)) {
                  setDropTarget(undefined);
                }
              }
            : undefined
        }
        onDrop={
          edit && tree
            ? (e) => insertNode(tree.id ?? "", e)
            : undefined
        }
      >
        {tree
          ? renderNode(tree, "0", {}, edit ? editCtx : undefined)
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