import type { LayoutNode } from "./layoutTypes";

const BOARD_NAMES = ["layoutTree.json", "layoutTree2.json"];

export const layouts: Record<string, LayoutNode> = {};

let layoutsPromise: Promise<Record<string, LayoutNode>> | null = null;

async function loadLayout(name: string): Promise<LayoutNode> {
  const res = await fetch(`/boards/${name}`);
  if (!res.ok) {
    throw new Error(`Failed to load ${name}: ${res.status}`);
  }
  return res.json();
}

export function loadLayouts(): Promise<Record<string, LayoutNode>> {
  if (!layoutsPromise) {
    layoutsPromise = Promise.all(
      BOARD_NAMES.map(async (name) => [name, await loadLayout(name)] as const)
    ).then((entries) => {
      const loaded = Object.fromEntries(entries);
      Object.assign(layouts, loaded);
      return loaded;
    });
  }
  return layoutsPromise;
}

export async function getInitialLayout(): Promise<LayoutNode> {
  const loaded = await loadLayouts();
  const first = BOARD_NAMES[0];
  return (loaded[first] as LayoutNode) ?? Object.values(loaded)[0];
}
