import type { LayoutChild, Node } from "../types";

const webCrypto = typeof crypto !== "undefined" ? crypto : undefined;

export const randomId = (): string => {
  if (typeof webCrypto?.randomUUID === "function") return webCrypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof webCrypto?.getRandomValues === "function") {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
};

export const createNode = (type: string, defaults: Partial<Node> = {}): Node => ({
  id: randomId(),
  type,
  ...defaults,
});

export const childrenOf = (
  children: LayoutChild[] | string | undefined,
): LayoutChild[] => {
  if (!children) return [];
  return Array.isArray(children) ? children : [children];
};

export const findNode = (
  root: Node,
  id: string,
): { node?: Node; parent?: Node; index?: number } => {
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
};

const mapChildren = (
  children: LayoutChild[] | string | undefined,
  fn: (c: LayoutChild) => LayoutChild,
): LayoutChild[] | string | undefined => {
  if (children === undefined) return undefined;
  const arr = Array.isArray(children) ? children : [children];
  const mapped = arr.map(fn);
  if (!Array.isArray(children)) return mapped[0] as LayoutChild[] | string;
  return mapped;
};

export const updateNode = (
  root: Node,
  id: string,
  updater: (n: Node) => void,
): Node => {
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
};

export const insertChildAt = (
  root: Node,
  parentId: string,
  index: number,
  child: Node,
): Node =>
  updateNode(root, parentId, (n) => {
    const arr = childrenOf(n.children);
    const idx = Math.max(0, Math.min(index, arr.length));
    arr.splice(idx, 0, child);
    n.children = arr;
  });

export const isSelfOrDescendant = (
  root: Node,
  ancestorId: string,
  id: string,
): boolean => {
  let current = findNode(root, id).node;
  while (current) {
    if (current.id === ancestorId) return true;
    current = findNode(root, current.id ?? "").parent;
  }
  return false;
};

export const moveNode = (
  root: Node,
  nodeId: string,
  toParentId: string,
  toIndex: number,
): Node => {
  const { node, parent, index } = findNode(root, nodeId);
  if (!node || index === undefined || parent?.id === undefined) return root;
  const fromParentId = parent.id;
  if (fromParentId === toParentId && index === toIndex) return root;
  if (!findNode(root, toParentId).node) return root;

  const next = updateNode(root, fromParentId, (p) => {
    p.children = childrenOf(p.children).filter((_, i) => i !== index);
  });

  let target = toIndex;
  if (fromParentId === toParentId && toIndex > index) target -= 1;
  const limit = childrenOf(findNode(next, toParentId).node?.children).length;
  target = Math.max(0, Math.min(target, limit));

  return insertChildAt(next, toParentId, target, { ...node });
};

const filterChildren = (
  children: LayoutChild[] | string | undefined,
  id: string,
): LayoutChild[] | string | undefined => {
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
};

export const deleteNode = (root: Node, id: string): Node => ({
  ...root,
  children: filterChildren(root.children, id),
});

const cloneWithNewIds = (n: Node): Node => ({
  ...n,
  id: randomId(),
  children: childrenOf(n.children).map((c) => (typeof c === "string" ? c : cloneWithNewIds(c))),
});

export const duplicateNode = (root: Node, id: string): Node => {
  const { node, parent, index } = findNode(root, id);
  if (!node || !parent || parent.id === undefined || index === undefined) return root;
  const clone = cloneWithNewIds(node);
  return updateNode(root, parent.id, (p) => {
    const arr = Array.isArray(p.children) ? [...p.children] : [];
    arr.splice(index + 1, 0, clone);
    p.children = arr;
  });
};

export const moveChild = (
  root: Node,
  parentId: string,
  index: number,
  dir: -1 | 1,
): Node => {
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
};

export const ensureIds = (node: Node): Node => {
  const children = node.children;
  const nextChildren: LayoutChild[] | string | undefined =
    Array.isArray(children)
      ? children.map((c) => (typeof c === "string" ? c : ensureIds(c)))
      : children;
  return {
    ...node,
    id: node.id ?? randomId(),
    children: nextChildren,
  };
};