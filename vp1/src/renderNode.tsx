import { createElement, type ReactNode } from "react";
import type { DragEvent, MouseEvent } from "react";
import { components } from "./components";
import type { LayoutChild, Node } from "./layoutTypes";

export interface EditContext {
  selectedId?: string;
  select: (id?: string) => void;
  isDroppable: (node: Node) => boolean;
  insertNode: (parentId: string, e: DragEvent) => void;
  dropTargetId?: string;
  setDropTarget: (id?: string) => void;
}

export default function renderNode(
  node: LayoutChild,
  path = "0",
  inheritedProps: Record<string, unknown> = {},
  edit?: EditContext,
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

  if (edit && id !== undefined) {
    isDropTarget = edit.isDroppable(node);
    props = {
      ...domProps,
      "data-ed-id": id,
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        edit.select(id);
      },
    };
    if (isDropTarget) {
      props.onDragEnter = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        edit.setDropTarget(id);
      };
      props.onDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        edit.setDropTarget(id);
      };
      props.onDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        edit.setDropTarget(undefined);
        edit.insertNode(id, e);
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

  let childNodes: ReactNode;
  const showPlaceholder =
    edit && isDropTarget && id !== undefined && edit.dropTargetId === id;
  if (children === undefined) {
    childNodes = showPlaceholder
      ? [
          createElement("div", {
            key: `${path}.placeholder`,
            className: "ed-drop-placeholder",
          }),
        ]
      : undefined;
  } else if (Array.isArray(children)) {
    const mapped = children.map((child, index) =>
      renderNode(child, `${path}.${index}`, baseProps, edit)
    );
    if (showPlaceholder) {
      mapped.push(
        createElement("div", {
          key: `${path}.placeholder`,
          className: "ed-drop-placeholder",
        })
      );
    }
    childNodes = mapped;
  } else {
    childNodes = showPlaceholder
      ? [
          children,
          createElement("div", {
            key: `${path}.placeholder`,
            className: "ed-drop-placeholder",
          }),
        ]
      : children;
  }

  const Component = components[type] ?? type;

  return createElement(
    Component,
    { key: path, ...props },
    childNodes,
  );
}