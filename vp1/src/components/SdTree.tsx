import {
  Fragment,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

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

export type TreeItemTemplate = (item: TreeItem, state: TreeItemState) => ReactNode;

/** Where a dragged node would land, relative to the hovered item. */
export type TreeDropPosition = "before" | "after" | "inside";

/** Resolved destination of a drop: the item to insert into and the child index. */
export interface TreeDropTarget {
  parentKey: string;
  index: number;
}

interface ItemElementProps {
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

interface SdTreeProps {
  data?: TreeItem | (TreeItem | string)[] | string | null;
  children?: ReactNode | TreeItemTemplate;
  /** Renders a leading icon per item, before its template content. */
  renderIcon?: (item: TreeItem, state: TreeItemState) => ReactNode;
  className?: string;
  selectedId?: string;
  onSelect?: (item: TreeItem, key: string) => void;
  defaultExpandedIds?: string[];
  /**
   * Enables drag and drop reordering. Called with the dragged key and the
   * resolved destination; the tree never mutates its data itself.
   */
  onMove?: (dragKey: string, target: TreeDropTarget) => void;
  /** Whether a node may be dropped *into* an item. Defaults to "has children". */
  canDropInside?: (item: TreeItem) => boolean;
  [key: string]: any;
}

const INDENT = 12;
const NODE_MIME = "tree-node-key";
const EDGE_RATIO = 0.25;

function toItemArray(value: unknown): TreeItem[] {
  if (value === null || value === undefined) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr.filter((v): v is TreeItem => typeof v === "object" && v !== null);
}

function childItems(item: TreeItem): TreeItem[] {
  return toItemArray(item.children);
}

/** Children exactly as the data stores them, including plain string children. */
function rawChildren(item: TreeItem): unknown[] {
  const value = item.children;
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function titleOf(item: TreeItem): string {
  const raw = item.title ?? item.label ?? item.name ?? item.type ?? item.id;
  return raw === undefined || raw === null ? "" : String(raw);
}

function keyOf(item: TreeItem, path: string): string {
  return item.id === undefined || item.id === null ? path : String(item.id);
}

const defaultTemplate: TreeItemTemplate = (item) => <li>{titleOf(item)}</li>;

const SdTree = ({
  data,
  children,
  renderIcon,
  className,
  selectedId,
  onSelect,
  defaultExpandedIds,
  onMove,
  canDropInside,
  ...rest
}: SdTreeProps) => {
  const items = useMemo(() => toItemArray(data), [data]);
  const template: TreeItemTemplate =
    typeof children === "function" ? (children as TreeItemTemplate) : defaultTemplate;
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(defaultExpandedIds),
  );
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined);
  const [dropAt, setDropAt] = useState<
    { key: string; position: TreeDropPosition } | undefined
  >(undefined);
  const dragKey = useRef<string | undefined>(undefined);
  const rootRef = useRef<HTMLUListElement>(null);
  const pendingFocus = useRef(false);
  const acceptsChildren = useCallback(
    (item: TreeItem) => canDropInside?.(item) ?? childItems(item).length > 0,
    [canDropInside],
  );

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const { keys, itemsByKey, parents } = useMemo(() => {
    const byKey = new Map<string, TreeItem>();
    const parentMap = new Map<string, string>();
    const order: string[] = [];
    const walk = (list: TreeItem[], parentKey: string | undefined, path: string) => {
      list.forEach((item, index) => {
        const key = keyOf(item, path ? `${path}.${index}` : String(index));
        byKey.set(key, item);
        if (parentKey !== undefined) parentMap.set(key, parentKey);
        order.push(key);
        if (expanded.has(key)) walk(childItems(item), key, key);
      });
    };
    walk(items, undefined, "");
    return { keys: order, itemsByKey: byKey, parents: parentMap };
  }, [items, expanded]);

  const selectedKey = useMemo(() => {
    if (selectedId === undefined) return undefined;
    if (itemsByKey.has(selectedId)) return selectedId;
    for (const [key, item] of itemsByKey) {
      if (item.id !== undefined && item.id !== null && String(item.id) === selectedId) {
        return key;
      }
    }
    return undefined;
  }, [selectedId, itemsByKey]);

  useEffect(() => {
    if (selectedKey === undefined) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      let cursor: string | undefined = selectedKey;
      let changed = false;
      while (cursor !== undefined) {
        if (!next.has(cursor)) {
          next.add(cursor);
          changed = true;
        }
        cursor = parents.get(cursor);
      }
      return changed ? next : prev;
    });
  }, [selectedKey, parents]);

  useEffect(() => {
    if (selectedKey === undefined) return;
    setActiveKey((prev) => (prev === selectedKey ? prev : selectedKey));
  }, [selectedKey]);

  useEffect(() => {
    if (!pendingFocus.current || activeKey === undefined) return;
    pendingFocus.current = false;
    const rendered = rootRef.current?.querySelectorAll<HTMLElement>("[data-tree-key]");
    if (!rendered) return;
    for (const node of Array.from(rendered)) {
      if (node.getAttribute("data-tree-key") === activeKey) {
        node.focus();
        break;
      }
    }
  }, [activeKey, expanded]);

  const selectItem = useCallback(
    (item: TreeItem, key: string) => {
      setActiveKey(key);
      onSelect?.(item, key);
    },
    [onSelect],
  );

  /** Turns a pointer position on an item into before/after/inside. */
  const dropPosition = (event: DragEvent<HTMLElement>, item: TreeItem) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    // A container row also wraps its expanded children, so the bands have to be
    // measured against the item's own row, not the whole subtree.
    const group = el.querySelector<HTMLElement>(":scope > [role='group']");
    const ownRow = group ? group.getBoundingClientRect().top - rect.top : rect.height;
    const height = ownRow > 4 ? ownRow : rect.height;
    const ratio = height > 0 ? (event.clientY - rect.top) / height : 0;
    if (acceptsChildren(item) && ratio > EDGE_RATIO && ratio < 1 - EDGE_RATIO) {
      return "inside" as const;
    }
    return ratio < 0.5 ? ("before" as const) : ("after" as const);
  };

  /** Resolves a hovered item plus position into a parent key and child index. */
  const resolveTarget = (
    targetKey: string,
    position: TreeDropPosition,
  ): TreeDropTarget | undefined => {
    const targetItem = itemsByKey.get(targetKey);
    if (!targetItem) return undefined;
    if (position === "inside") {
      return { parentKey: targetKey, index: rawChildren(targetItem).length };
    }
    // Beside a root item there is no parent to insert into.
    const parentKey = parents.get(targetKey);
    if (parentKey === undefined) return undefined;
    const siblings = rawChildren(itemsByKey.get(parentKey) ?? {});
    const at = siblings.findIndex((child) => child === targetItem);
    if (at < 0) return undefined;
    return { parentKey, index: position === "before" ? at : at + 1 };
  };

  /** Rejects drops onto the dragged node itself or into its own subtree. */
  const canDrop = (dragged: string, target: TreeDropTarget | undefined) => {
    if (!target) return false;
    if (!parents.has(dragged)) return false;
    let cursor: string | undefined = target.parentKey;
    while (cursor !== undefined) {
      if (cursor === dragged) return false;
      cursor = parents.get(cursor);
    }
    return true;
  };

  const focusKey = useCallback((key: string) => {
    pendingFocus.current = true;
    setActiveKey(key);
  }, []);

  const renderItem = (item: TreeItem, key: string, depth: number): ReactNode => {
    const kids = childItems(item);
    const hasChildren = kids.length > 0;
    const isExpanded = hasChildren && expanded.has(key);
    const isSelected = selectedKey === key;
    const isActive = activeKey === key || (activeKey === undefined && keys[0] === key);

    const state: TreeItemState = {
      key,
      depth,
      hasChildren,
      expanded: isExpanded,
      selected: isSelected,
      toggle: () => toggle(key),
      select: () => selectItem(item, key),
    };

    const twisty = hasChildren ? (
      <span
        className="Tree-twisty"
        onClick={(e) => {
          e.stopPropagation();
          toggle(key);
        }}
      >
        {isExpanded ? "▾" : "▸"}
      </span>
    ) : (
      <span className="Tree-twisty Tree-twisty-empty" />
    );

    const iconNode = renderIcon?.(item, state);
    const leading = iconNode ? (
      <span className="Tree-icon">{iconNode}</span>
    ) : null;

    const group = isExpanded ? (
      <ul role="group" className="Tree-group" style={{ paddingLeft: INDENT }}>
        {kids.map((child, index) =>
          renderItem(child, keyOf(child, `${key}.${index}`), depth + 1),
        )}
      </ul>
    ) : null;

    const itemProps: Record<string, unknown> = {
      role: "treeitem",
      "aria-expanded": hasChildren ? isExpanded : undefined,
      "aria-selected": isSelected,
      "aria-level": depth + 1,
      tabIndex: isActive ? 0 : -1,
      "data-tree-key": key,
      className: [
        "Tree-item",
        isSelected ? "Tree-item-selected" : undefined,
        dropAt?.key === key ? `Tree-drop-${dropAt.position}` : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    };

    const rendered = template(item, state);

    // Clicks inside a nested treeitem bubble up to every ancestor item, so
    // ignore anything that did not originate on this item.
    const activate = (e: MouseEvent<HTMLElement>) => {
      const origin = (e.target as HTMLElement | null)?.closest?.("[data-tree-key]");
      if (origin?.getAttribute("data-tree-key") !== key) return;
      selectItem(item, key);
    };

    const dragHandlers: ItemElementProps = onMove
      ? {
        draggable: true,
        onDragStart: (e: DragEvent<HTMLElement>) => {
          e.stopPropagation();
          dragKey.current = key;
          setActiveKey(key);
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData(NODE_MIME, key);
        },
        onDragEnd: () => {
          dragKey.current = undefined;
          setDropAt(undefined);
        },
        onDragEnter: (e: DragEvent<HTMLElement>) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        },
        onDragOver: (e: DragEvent<HTMLElement>) => {
          const origin = (e.target as HTMLElement | null)?.closest?.(
            "[data-tree-key]",
          );
          if (origin?.getAttribute("data-tree-key") !== key) return;
          const dragged = dragKey.current;
          if (!dragged || dragged === key) return;
          const position = dropPosition(e, item);
          const target = resolveTarget(key, position);
          if (!canDrop(dragged, target)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDropAt((prev) =>
            prev && prev.key === key && prev.position === position
              ? prev
              : { key, position },
          );
        },
        onDragLeave: (e: DragEvent<HTMLElement>) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setDropAt((prev) => (prev?.key === key ? undefined : prev));
        },
        onDrop: (e: DragEvent<HTMLElement>) => {
          const origin = (e.target as HTMLElement | null)?.closest?.(
            "[data-tree-key]",
          );
          if (origin?.getAttribute("data-tree-key") !== key) return;
          e.preventDefault();
          e.stopPropagation();
          const dragged = dragKey.current ?? e.dataTransfer.getData(NODE_MIME);
          const position = dropPosition(e, item);
          const target = resolveTarget(key, position);
          setDropAt(undefined);
          dragKey.current = undefined;
          if (!dragged || !canDrop(dragged, target) || !target) return;
          onMove?.(dragged, target);
        },
      }
      : {};

    if (isValidElement(rendered)) {
      const element = rendered as ReactElement<ItemElementProps>;
      return cloneElement(
        element,
        {
          key,
          ...itemProps,
          ...dragHandlers,
          className: [itemProps.className, element.props.className]
            .filter(Boolean)
            .join(" "),
          onClick: (e: MouseEvent<HTMLElement>) => {
            element.props.onClick?.(e);
            if (e.defaultPrevented) return;
            activate(e);
          },
        },
        <Fragment key="twisty">{twisty}</Fragment>,
        <Fragment key="icon">{leading}</Fragment>,
        <Fragment key="content">{element.props.children}</Fragment>,
        <Fragment key="group">{group}</Fragment>,
      );
    }

    return (
      <li key={key} {...itemProps} {...dragHandlers} onClick={activate}>
        {twisty}
        {leading}
        {rendered}
        {group}
      </li>
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const target = (event.target as HTMLElement).closest("[data-tree-key]");
    const key = target?.getAttribute("data-tree-key");
    if (key === undefined || key === null) return;
    const index = keys.indexOf(key);
    const item = itemsByKey.get(key);
    const kids = item ? childItems(item) : [];
    const hasChildren = kids.length > 0;
    const isExpanded = hasChildren && expanded.has(key);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (index < keys.length - 1) focusKey(keys[index + 1]);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (index > 0) focusKey(keys[index - 1]);
        break;
      case "ArrowRight":
        event.preventDefault();
        if (hasChildren && !isExpanded) toggle(key);
        else if (hasChildren) focusKey(keyOf(kids[0], `${key}.0`));
        break;
      case "ArrowLeft": {
        event.preventDefault();
        const parent = parents.get(key);
        if (hasChildren && isExpanded) toggle(key);
        else if (parent !== undefined) focusKey(parent);
        break;
      }
      case "Home":
        event.preventDefault();
        if (keys.length > 0) focusKey(keys[0]);
        break;
      case "End":
        event.preventDefault();
        if (keys.length > 0) focusKey(keys[keys.length - 1]);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (item) selectItem(item, key);
        break;
      default:
        break;
    }
  };

  return (
    <ul
      {...rest}
      ref={rootRef}
      role="tree"
      className={["Tree", className].filter(Boolean).join(" ")}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => renderItem(item, keyOf(item, String(index)), 0))}
    </ul>
  );
};

export default SdTree;
