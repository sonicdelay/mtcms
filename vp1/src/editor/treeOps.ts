import type { LayoutChild, Node } from "../layoutTypes";

export function createNode(type: string, defaults: Partial<Node> = {}): Node {
  return { id: crypto.randomUUID(), type, ...defaults };
}

export function childrenOf(children: LayoutChild[] | string | undefined): LayoutChild[] {
  if (!children) return [];
  return Array.isArray(children) ? children : [children];
}

export function findNode(
  root: Node,
  id: string
): { node?: Node; parent?: Node; index?: number } {
  if (root.id === id) return { node: root };
  const children = childrenOf(root.children);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (typeof child === "string") continue;
    const res = findNode(child, id);
    if (res.node) {
      return { node: res.node, parent: res.parent ?? root, index: res.index ?? i };
    }
  }
  return {};
}

function mapChildren(
  children: LayoutChild[] | string | undefined,
  fn: (c: LayoutChild) => LayoutChild,
): LayoutChild[] | string | undefined {
  if (children === undefined) return undefined;
  const arr = Array.isArray(children) ? children : [children];
  const mapped = arr.map(fn);
  if (!Array.isArray(children)) return mapped[0] as LayoutChild[] | string;
  return mapped;
}

export function updateNode(root: Node, id: string, updater: (n: Node) => void): Node {
  if (root.id === id) {
    const copy: Node = {
      ...root,
      children: Array.isArray(root.children) ? [...root.children] : root.children,
    };
    updater(copy);
    return copy;
  }
  return {
    ...root,
    children: mapChildren(root.children, (c) => (typeof c === "string" ? c : updateNode(c, id, updater))),
  };
}

export function insertChildAt(
  root: Node,
  parentId: string,
  index: number,
  child: Node,
): Node {
  return updateNode(root, parentId, (n) => {
    const arr = childrenOf(n.children);
    const idx = Math.max(0, Math.min(index, arr.length));
    arr.splice(idx, 0, child);
    n.children = arr;
  });
}

export function isSelfOrDescendant(
  root: Node,
  ancestorId: string,
  id: string,
): boolean {
  let current = findNode(root, id).node;
  while (current) {
    if (current.id === ancestorId) return true;
    current = findNode(root, current.id ?? "").parent;
  }
  return false;
}

export function moveNode(
  root: Node,
  nodeId: string,
  toParentId: string,
  toIndex: number,
): Node {
  const { node, parent, index } = findNode(root, nodeId);
  if (!node || index === undefined || parent?.id === undefined) return root;
  const fromParentId = parent.id;
  if (fromParentId === toParentId && index === toIndex) return root;
  if (!findNode(root, toParentId).node) return root;

  let next = updateNode(root, fromParentId, (p) => {
    p.children = childrenOf(p.children).filter((_, i) => i !== index);
  });

  let target = toIndex;
  if (fromParentId === toParentId && toIndex > index) target -= 1;
  const limit = childrenOf(findNode(next, toParentId).node?.children).length;
  target = Math.max(0, Math.min(target, limit));

  return insertChildAt(next, toParentId, target, { ...node });
}

function filterChildren(
  children: LayoutChild[] | string | undefined,
  id: string,
): LayoutChild[] | string | undefined {
  const arr = childrenOf(children);
  const out: LayoutChild[] = [];
  for (const c of arr) {
    if (typeof c === "string") {
      out.push(c);
      continue;
    }
    if (c.id === id) continue;
    out.push({ ...c, children: filterChildren(c.children, id) });
  }
  if (out.length === 0) return undefined;
  if (children !== undefined && !Array.isArray(children)) return out[0] as LayoutChild[] | string;
  return out;
}

export function deleteNode(root: Node, id: string): Node {
  return { ...root, children: filterChildren(root.children, id) };
}

function cloneWithNewIds(n: Node): Node {
  return {
    ...n,
    id: crypto.randomUUID(),
    children: childrenOf(n.children).map((c) => (typeof c === "string" ? c : cloneWithNewIds(c))),
  };
}

export function duplicateNode(root: Node, id: string): Node {
  const { node, parent, index } = findNode(root, id);
  if (!node || !parent || parent.id === undefined || index === undefined) return root;
  const clone = cloneWithNewIds(node);
  return updateNode(root, parent.id, (p) => {
    const arr = Array.isArray(p.children) ? [...p.children] : [];
    arr.splice(index + 1, 0, clone);
    p.children = arr;
  });
}

export function moveChild(root: Node, parentId: string, index: number, dir: -1 | 1): Node {
  const { node: parent } = findNode(root, parentId);
  if (!parent) return root;
  const arr = childrenOf(parent.children);
  const newIdx = index + dir;
  if (newIdx < 0 || newIdx >= arr.length) return root;
  const [item] = arr.splice(index, 1);
  arr.splice(newIdx, 0, item);
  return updateNode(root, parentId, (p) => {
    p.children = arr;
  });
}

export function ensureIds(node: Node): Node {
  const children = node.children;
  const nextChildren: LayoutChild[] | string | undefined =
    Array.isArray(children)
      ? children.map((c) => (typeof c === "string" ? c : ensureIds(c)))
      : children;
  return {
    ...node,
    id: node.id ?? crypto.randomUUID(),
    children: nextChildren,
  };
}