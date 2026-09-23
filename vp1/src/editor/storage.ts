import type { Node } from "../layoutTypes";

const STORAGE_KEY = "vp1_layout_overrides_v1";

type Overrides = Record<string, Node>;

function read(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Overrides;
  } catch {
    return {};
  }
}

export function loadOverride(name: string): Node | null {
  return read()[name] ?? null;
}

export function saveOverride(name: string, tree: Node): void {
  const all = read();
  all[name] = tree;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearOverride(name: string): void {
  const all = read();
  delete all[name];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}