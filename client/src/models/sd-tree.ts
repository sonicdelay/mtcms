import type { CSSProperties, DragEvent, MouseEvent, ReactNode } from "react";

export interface TreeItem {
  id?: string | number;
  title?: string;
  children?: TreeItem | (TreeItem | string)[] | string;
  [key: string]: unknown;
}

export interface TreeItemState {
  key: string;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  selected: boolean;
  toggle: () => void;
  select: () => void;
}

export type TreeItemTemplate = (
  item: TreeItem,
  state: TreeItemState
) => ReactNode;

export type TreeDropPosition = "before" | "after" | "inside";

export interface TreeDropTarget {
  parentKey: string;
  index: number;
}

/** DOM props the tree installs on a cloned template element. */
export interface TreeItemElementProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  draggable?: boolean;
  onDragStart?: (e: DragEvent<HTMLElement>) => void;
  onDragEnd?: (e: DragEvent<HTMLElement>) => void;
  onDragEnter?: (e: DragEvent<HTMLElement>) => void;
  onDragOver?: (e: DragEvent<HTMLElement>) => void;
  onDragLeave?: (e: DragEvent<HTMLElement>) => void;
  onDrop?: (e: DragEvent<HTMLElement>) => void;
}

/**
 * Tree setup. The callbacks here mirror the tree's outgoing events, which are
 * also emitted over `onChange` (`select`, `move`, `dropExternal`).
 *
 * Behavioural notes carried over from the component (Sd*.tsx files carry no
 * comments):
 *
 * - Selection and auto-reveal walk every node, including those hidden behind a
 *   collapsed ancestor; rendering and drop resolution only consider expanded
 *   nodes.
 * - Drop position bands are measured against an item's own row, not its whole
 *   subtree, because a container row also wraps its expanded children.
 * - Clicks inside a nested treeitem bubble up to every ancestor item, so only
 *   clicks originating on the item itself select it.
 */
export interface SdTreeConfig {
  renderIcon?: (item: TreeItem, state: TreeItemState) => ReactNode;
  selectedId?: string;
  onSelect?: (item: TreeItem, key: string) => void;
  defaultExpandedIds?: string[];
  onMove?: (dragKey: string, target: TreeDropTarget) => void;
  onDropExternal?: (componentType: string, target: TreeDropTarget) => void;
  canDropInside?: (item: TreeItem) => boolean;
}
