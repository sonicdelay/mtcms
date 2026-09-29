import type { Node } from "../layoutTypes";

const STORAGE_KEY = "vp1_layout_overrides_v1";

type Overrides = Record<string, Node>;

const read = (): Overrides => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Overrides;
  } catch {
    return {};
  }
};

export const loadOverride = (name: string): Node | null => read()[name] ?? null;

export const saveOverride = (name: string, tree: Node): void => {
  const all = read();
  all[name] = tree;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

export const clearOverride = (name: string): void => {
  const all = read();
  delete all[name];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};