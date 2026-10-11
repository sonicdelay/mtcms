import type { ReactNode } from "react";

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
  state: TreeItemState,
) => ReactNode;

export type TreeDropPosition = "before" | "after" | "inside";

export interface TreeDropTarget {
  parentKey: string;
  index: number;
}

export interface SdTreeConfig {
  renderIcon?: (item: TreeItem, state: TreeItemState) => ReactNode;
  selectedId?: string;
  onSelect?: (item: TreeItem, key: string) => void;
  defaultExpandedIds?: string[];
  onMove?: (dragKey: string, target: TreeDropTarget) => void;
  onDropExternal?: (componentType: string, target: TreeDropTarget) => void;
  canDropInside?: (item: TreeItem) => boolean;
}
