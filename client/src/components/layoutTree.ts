import type { Node } from "../models/types.js";

const BOARD_NAMES = ["empty.json", "layoutTree.json", "layoutTree2.json", "export.json"];

export const layouts: Record<string, Node> = {};

let layoutsPromise: Promise<Record<string, Node>> | null = null;

const loadLayout = async (name: string): Promise<Node> => {
  const res = await fetch(`/boards/${name}`);
  if (!res.ok) {
    throw new Error(`Failed to load ${name}: ${res.status}`);
  }
  return res.json();
};

export const loadLayouts = (): Promise<Record<string, Node>> => {
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
};

export const getInitialLayout = async (): Promise<Node> => {
  const loaded = await loadLayouts();
  const first = BOARD_NAMES[0];
  return (loaded[first] as Node) ?? Object.values(loaded)[0];
};
