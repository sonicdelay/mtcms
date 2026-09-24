import { createElement, type ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { DragEvent, MouseEvent } from "react";
import { components } from "../components";
import type { LayoutChild, Node } from "../layoutTypes";
import { isDroppable, palette } from "./registry";
import {
  childrenOf,
  createNode,
  insertChildAt,
  isSelfOrDescendant,
  moveNode,
} from "./treeOps";

export interface EditContext {
  selectedId?: string;
  select: (id?: string) => void;
  isDroppable: (node: Node) => boolean;
  dropNode: (targetId: string, e: DragEvent, index?: number) => void;
  dropTargetId?: string;
  dropIndex: number;
  setDropTarget: (id?: string, index?: number) => void;
}

export interface CanvasProps {
  onClick: () => void;
  onDragOver?: (e: DragEvent) => void;
  onDragLeave?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
}

function insertionIndex(e: DragEvent): number {
  const container = e.currentTarget as HTMLElement;
  const children = Array.from(container.children).filter(
    (el) => !el.classList.contains("ed-drop-placeholder")
  );
  if (children.length === 0) return 0;
  const rects = children.map((el) => el.getBoundingClientRect());
  const spanX =
    Math.max(...rects.map((r) => r.right)) -
    Math.min(...rects.map((r) => r.left));
  const spanY =
    Math.max(...rects.map((r) => r.bottom)) -
    Math.min(...rects.map((r) => r.top));
  const horizontal = spanX > spanY;
  const pointer = horizontal ? e.clientX : e.clientY;
  for (let i = 0; i < rects.length; i++) {
    const mid = horizontal
      ? rects[i].left + rects[i].width / 2
      : rects[i].top + rects[i].height / 2;
    if (pointer < mid) return i;
  }
  return rects.length;
}

export function useDragDrop(
  tree: Node | null,
  commit: (next: Node) => void,
  active: boolean,
) {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [dropTargetId, setDropTargetId] = useState<string | undefined>(undefined);
  const [dropIndex, setDropIndex] = useState(0);

  useEffect(() => {
    const clearDropTarget = () => {
      setDropTargetId(undefined);
      setDropIndex(0);
    };
    document.addEventListener("drop", clearDropTarget);
    document.addEventListener("dragend", clearDropTarget, true);
    return () => {
      document.removeEventListener("drop", clearDropTarget);
      document.removeEventListener("dragend", clearDropTarget, true);
    };
  }, []);

  const select = useCallback((id?: string) => setSelectedId(id), []);

  const setDropTarget = useCallback((id?: string, index?: number) => {
    setDropTargetId(id);
    if (id === undefined) setDropIndex(0);
    else if (index !== undefined) setDropIndex(index);
  }, []);

  const reset = useCallback(() => {
    setSelectedId(undefined);
    setDropTargetId(undefined);
    setDropIndex(0);
  }, []);

  const dropNode = useCallback(
    (targetId: string, e: DragEvent, index?: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDropTargetId(undefined);
      setDropIndex(0);
      if (!tree) return;
      const nodeId = e.dataTransfer.getData("ed-node-id");
      const type = e.dataTransfer.getData("component-type");
      if (nodeId) {
        if (nodeId === targetId) return;
        if (isSelfOrDescendant(tree, nodeId, targetId)) return;
        const next = moveNode(tree, nodeId, targetId, index ?? 0);
        if (next !== tree) commit(next);
      } else {
        const item = palette[type];
        if (!item) return;
        const child = createNode(type, item.defaultProps());
        commit(insertChildAt(tree, targetId, index ?? 0, child));
      }
    },
    [tree, commit]
  );

  const editCtx: EditContext = {
    selectedId,
    select,
    isDroppable,
    dropNode,
    dropTargetId,
    dropIndex,
    setDropTarget,
  };

  const canvasProps: CanvasProps = tree
    ? {
        onClick: () => select(undefined),
        onDragOver: active
          ? (e) => {
              e.preventDefault();
              setDropTarget(tree.id, childrenOf(tree.children).length);
            }
          : undefined,
        onDragLeave: active
          ? (e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Element | null)) {
                setDropTarget(undefined);
              }
            }
          : undefined,
        onDrop: active
          ? (e) => dropNode(tree.id ?? "", e, childrenOf(tree.children).length)
          : undefined,
      }
    : { onClick: () => select(undefined) };

  return { selectedId, select, editCtx, canvasProps, reset };
}

export function renderEditable(
  node: LayoutChild,
  path = "0",
  inheritedProps: Record<string, unknown> = {},
  edit: EditContext,
): ReactNode {
  if (typeof node === "string") {
    return createElement("span", { key: path, ...inheritedProps }, node);
  }

  const { type, children, ...restProps } = node;
  const id = node.id;
  const baseProps = { ...inheritedProps, ...restProps };

  const domProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(baseProps)) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)) continue;
    if (value === undefined) continue;
    if (value !== null && typeof value === "object" && key !== "style" && key !== "className") continue;
    domProps[key] = value;
  }

  let props: Record<string, unknown> = domProps;
  let isDropTarget = false;

  if (id !== undefined) {
    isDropTarget = edit.isDroppable(node);
    props = {
      ...domProps,
      draggable: true,
      "data-ed-id": id,
      onDragStart: (e: DragEvent) => {
        e.stopPropagation();
        const dt = e.dataTransfer;
        dt.setData("ed-node-id", id);
        dt.effectAllowed = "move";
      },
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        edit.select(id);
      },
    };
    if (isDropTarget) {
      props.onDragEnter = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        edit.setDropTarget(id, insertionIndex(e));
      };
      props.onDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        edit.setDropTarget(id, insertionIndex(e));
      };
      props.onDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        edit.dropNode(id, e, insertionIndex(e));
      };
    }
    const classes = [
      props.className,
      edit.selectedId === id ? "ed-selected" : undefined,
      isDropTarget && edit.dropTargetId === id ? "ed-drop-target" : undefined,
    ]
      .filter(Boolean)
      .join(" ");
    if (classes) props.className = classes;
  }

  const placeholder = createElement("div", {
    key: `${path}.placeholder`,
    className: "ed-drop-placeholder",
  });

  let childNodes: ReactNode;
  const showPlaceholder =
    isDropTarget && id !== undefined && edit.dropTargetId === id;
  if (children === undefined) {
    childNodes = showPlaceholder ? [placeholder] : undefined;
  } else if (Array.isArray(children)) {
    const mapped = children.map((child, index) =>
      renderEditable(child, `${path}.${index}`, baseProps, edit)
    );
    if (showPlaceholder) {
      const idx = Math.max(0, Math.min(edit.dropIndex, mapped.length));
      mapped.splice(idx, 0, placeholder);
    }
    childNodes = mapped;
  } else {
    childNodes = showPlaceholder
      ? edit.dropIndex > 0
        ? [children, placeholder]
        : [placeholder, children]
      : children;
  }

  const Component = components[type] ?? type;

  return createElement(
    Component,
    { key: path, ...props },
    childNodes,
  );
}