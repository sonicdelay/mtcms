import type { Node } from "../layoutTypes";

export interface ConfigField {
  key: string;
  label: string;
  kind?: "text" | "number" | "select" | "textarea";
  options?: string[];
}

export interface PaletteItem {
  type: string;
  title: string;
  droppable?: boolean;
  defaultProps: () => Partial<Node>;
  settings?: ConfigField[];
}

const SOURCE_OPTIONS = ["sin", "cos", "tan", "data.0", "data.1"];

export const palette: Record<string, PaletteItem> = {
  SdPane: {
    type: "SdPane",
    title: "Pane",
    droppable: true,
    defaultProps: () => ({ className: "flex flex-row" }),
    settings: [],
  },
  SdWave: {
    type: "SdWave",
    title: "Wave",
    defaultProps: () => ({ title: "Wave", source: "sin", className: "border border-gray-300" }),
    settings: [
      { key: "title", label: "Title" },
      { key: "source", label: "Source", kind: "select", options: SOURCE_OPTIONS },
    ],
  },
  SdWaveValue: {
    type: "SdWaveValue",
    title: "Wave Value",
    defaultProps: () => ({ title: "Value", source: "sin", className: "text-sm text-green-200" }),
    settings: [
      { key: "title", label: "Title" },
      { key: "source", label: "Source", kind: "select", options: SOURCE_OPTIONS },
    ],
  },
  SdWaveBar: {
    type: "SdWaveBar",
    title: "Wave Bar",
    defaultProps: () => ({ title: "Bar", source: "sin", className: "" }),
    settings: [
      { key: "title", label: "Title" },
      { key: "source", label: "Source", kind: "select", options: SOURCE_OPTIONS },
    ],
  },
  SdGauge: {
    type: "SdGauge",
    title: "Gauge",
    defaultProps: () => ({ title: "Gauge", source: "sin", min: -1, max: 1, className: "" }),
    settings: [
      { key: "title", label: "Title" },
      { key: "source", label: "Source", kind: "select", options: SOURCE_OPTIONS },
      { key: "min", label: "Min", kind: "number" },
      { key: "max", label: "Max", kind: "number" },
    ],
  },
  SdText: {
    type: "SdText",
    title: "Text",
    defaultProps: () => ({ children: "Some text here", className: "text-red-500" }),
    settings: [{ key: "children", label: "Text", kind: "textarea" }],
  },
  SdButton: {
    type: "SdButton",
    title: "Button",
    defaultProps: () => ({ data: "Button", className: "bg-gray-700 p-4", actions: [] }),
    settings: [{ key: "data", label: "Label" }],
  },
  h1: {
    type: "h1",
    title: "Heading",
    defaultProps: () => ({ children: "Heading", className: "" }),
    settings: [{ key: "children", label: "Text", kind: "textarea" }],
  },
  img: {
    type: "img",
    title: "Image",
    defaultProps: () => ({ src: "public/images/engine.jpg", alt: "image", className: "" }),
    settings: [
      { key: "src", label: "Src" },
      { key: "alt", label: "Alt" },
    ],
  },
  div: {
    type: "div",
    title: "Div Box",
    droppable: true,
    defaultProps: () => ({ className: "flex flex-col" }),
    settings: [],
  },
  article: {
    type: "article",
    title: "Article",
    droppable: true,
    defaultProps: () => ({ className: "" }),
    settings: [],
  },
  button: {
    type: "button",
    title: "Button Element",
    defaultProps: () => ({ children: "Click", className: "" }),
    settings: [{ key: "children", label: "Label" }],
  },
};

export function isDroppable(node: Node): boolean {
  const item = palette[node.type];
  if (item?.droppable === true) return true;
  if (item?.droppable === false) return false;
  return Array.isArray(node.children);
}