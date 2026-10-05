import type { Node } from "../types";
import type { IconName } from "./icons";

export interface ConfigField {
  key: string;
  label: string;
  kind?: "text" | "number" | "select" | "textarea";
  options?: string[];
}

export type PaletteGroupId =
  | "components"
  | "layout"
  | "headings"
  | "text"
  | "inline"
  | "media"
  | "table"
  | "form";

export const paletteGroupTitles: Record<PaletteGroupId, string> = {
  components: "Components",
  layout: "Layout",
  headings: "Headings",
  text: "Text",
  inline: "Inline",
  media: "Media",
  table: "Table",
  form: "Form",
};

export interface PaletteItem {
  type: string;
  title: string;
  icon: IconName;
  group: PaletteGroupId;
  droppable?: boolean;
  defaultProps: () => Partial<Node>;
  settings?: ConfigField[];
  actions?: Record<string, any>[];
}

export interface PaletteGroup {
  id: PaletteGroupId;
  title: string;
  items: PaletteItem[];
}

const SOURCE_OPTIONS = ["sin", "cos", "tan", "data.0", "data.1"];
const INPUT_TYPES = [
  "text",
  "password",
  "email",
  "number",
  "search",
  "url",
  "tel",
  "date",
  "time",
  "color",
  "range",
  "checkbox",
  "radio",
  "file",
];
const BUTTON_TYPES = ["button", "submit", "reset"];
const METHOD_OPTIONS = ["get", "post", "dialog"];
const DIR_OPTIONS = ["ltr", "rtl", "auto"];
const LIST_TYPES = ["1", "a", "A", "i", "I"];
const AREA_SHAPES = ["rect", "circle", "poly", "default"];
const TRACK_KINDS = [
  "subtitles",
  "captions",
  "descriptions",
  "chapters",
  "metadata",
];

const text = (label = "Text"): ConfigField[] => [
  { key: "children", label, kind: "textarea" },
];

const container = (
  type: string,
  title: string,
  icon: IconName,
  group: PaletteGroupId,
  props: Partial<Node> = {},
  settings?: ConfigField[],
): PaletteItem => ({
  type,
  title,
  icon,
  group,
  droppable: true,
  defaultProps: () => ({ ...props }),
  settings: settings ?? text(),
});

const leaf = (
  type: string,
  title: string,
  icon: IconName,
  group: PaletteGroupId,
  props: Partial<Node> = {},
  settings?: ConfigField[],
): PaletteItem => ({
  type,
  title,
  icon,
  group,
  droppable: false,
  defaultProps: () => ({ ...props }),
  settings: settings ?? text(),
});

const structural: ConfigField[] = [];

export const palette: Record<string, PaletteItem> = {
  SdPane: {
    type: "SdPane",
    title: "Pane",
    icon: "layout",
    group: "components",
    droppable: true,
    defaultProps: () => ({ className: "flex flex-row" }),
    settings: [],
  },
  SdDummy: {
    type: "SdDummy",
    title: "Dummy",
    icon: "box",
    group: "components",
    droppable: true,
    defaultProps: () => ({ value: "default value" }),
    settings: [{ key: "value", label: "Value", kind: "textarea" }],
  },
  SdWave: {
    type: "SdWave",
    title: "Wave",
    icon: "activity",
    group: "components",
    defaultProps: () => ({ title: "Wave", source: "sin", className: "border border-gray-300" }),
    settings: [
      { key: "title", label: "Title" },
      { key: "source", label: "Source", kind: "select", options: SOURCE_OPTIONS },
    ],
  },
  SdWaveValue: {
    type: "SdWaveValue",
    title: "Wave Value",
    icon: "trendingUp",
    group: "components",
    defaultProps: () => ({ title: "Value", source: "sin", className: "text-sm text-green-200" }),
    settings: [
      { key: "title", label: "Title" },
      { key: "source", label: "Source", kind: "select", options: SOURCE_OPTIONS },
    ],
  },
  SdWaveBar: {
    type: "SdWaveBar",
    title: "Wave Bar",
    icon: "barChart",
    group: "components",
    defaultProps: () => ({ title: "Bar", source: "sin", className: "" }),
    settings: [
      { key: "title", label: "Title" },
      { key: "source", label: "Source", kind: "select", options: SOURCE_OPTIONS },
    ],
  },
  SdGauge: {
    type: "SdGauge",
    title: "Gauge",
    icon: "gauge",
    group: "components",
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
    icon: "textBlock",
    group: "components",
    defaultProps: () => ({ children: "Some text here", className: "text-red-500" }),
    settings: [{ key: "children", label: "Text", kind: "textarea" }],
  },
  SdButton: {
    type: "SdButton",
    title: "Button",
    icon: "buttonPointer",
    group: "components",
    defaultProps: () => ({ value: "Button", className: "bg-gray-700 p-4", actions: [] }),
    settings: [{ key: "data", label: "Label" }],
  },

  div: container("div", "Div Box", "box", "layout", { className: "flex flex-col" }),
  section: container("section", "Section", "section", "layout"),
  article: container("article", "Article", "article", "layout"),
  aside: container("aside", "Aside", "aside", "layout"),
  nav: container("nav", "Nav", "nav", "layout"),
  header: container("header", "Header", "header", "layout"),
  footer: container("footer", "Footer", "footer", "layout"),
  main: container("main", "Main", "main", "layout"),
  address: container("address", "Address", "address", "layout"),
  hgroup: container("hgroup", "Heading Group", "hgroup", "layout"),
  details: container("details", "Details", "details", "layout", { open: true }),
  summary: leaf("summary", "Summary", "details", "layout", { children: "Summary" }),
  dialog: container("dialog", "Dialog", "dialog", "layout", { open: true }),

  h1: container("h1", "Heading 1", "heading1", "headings", { children: "Heading" }),
  h2: container("h2", "Heading 2", "heading2", "headings", { children: "Heading" }),
  h3: container("h3", "Heading 3", "heading3", "headings", { children: "Heading" }),
  h4: container("h4", "Heading 4", "heading4", "headings", { children: "Heading" }),
  h5: container("h5", "Heading 5", "heading5", "headings", { children: "Heading" }),
  h6: container("h6", "Heading 6", "heading6", "headings", { children: "Heading" }),

  p: container("p", "Paragraph", "paragraph", "text", { children: "Paragraph text" }),
  blockquote: container(
    "blockquote",
    "Blockquote",
    "blockquote",
    "text",
    { children: "Quoted text" },
    [{ key: "cite", label: "Cite" }, ...text()],
  ),
  pre: container("pre", "Preformatted", "preformatted", "text", {
    children: "preformatted text",
    className: "font-mono text-sm",
  }),
  hr: leaf("hr", "Rule", "rule", "text", {}, structural),
  br: leaf("br", "Line Break", "lineBreak", "text", {}, structural),
  wbr: leaf("wbr", "Word Break", "wordBreak", "text", {}, structural),
  figure: container("figure", "Figure", "figure", "text"),
  figcaption: leaf("figcaption", "Figcaption", "figure", "text", {
    children: "Caption",
  }),
  ol: container(
    "ol",
    "Ordered List",
    "orderedList",
    "text",
    { className: "list-decimal pl-5" },
    [
      { key: "start", label: "Start", kind: "number" },
      { key: "type", label: "Type", kind: "select", options: LIST_TYPES },
    ],
  ),
  ul: container("ul", "Unordered List", "unorderedList", "text", {
    className: "list-disc pl-5",
  }),
  li: container("li", "List Item", "listItem", "text"),
  dl: container("dl", "Description List", "descriptionList", "text"),
  dt: leaf("dt", "Term", "term", "text", { children: "Term" }),
  dd: leaf("dd", "Description", "description", "text", { children: "Description" }),

  span: container("span", "Span", "span", "inline", { children: "Text" }),
  a: container(
    "a",
    "Link",
    "link",
    "inline",
    { children: "Link", href: "#", className: "underline" },
    [{ key: "href", label: "Href" }, ...text()],
  ),
  strong: container("strong", "Strong", "bold", "inline", { children: "Strong" }),
  b: container("b", "Bold", "bold", "inline", { children: "Bold" }),
  em: container("em", "Emphasis", "italic", "inline", { children: "Emphasis" }),
  i: container("i", "Italic", "italic", "inline", { children: "Italic" }),
  u: container("u", "Underline", "underline", "inline", { children: "Underline" }),
  s: container("s", "Strikeout", "strikethrough", "inline", { children: "Strikeout" }),
  del: container(
    "del",
    "Deleted",
    "strikethrough",
    "inline",
    { children: "Deleted" },
    [
      { key: "cite", label: "Cite" },
      { key: "datetime", label: "Datetime" },
      ...text(),
    ],
  ),
  ins: container(
    "ins",
    "Inserted",
    "underline",
    "inline",
    { children: "Inserted" },
    [
      { key: "cite", label: "Cite" },
      { key: "datetime", label: "Datetime" },
      ...text(),
    ],
  ),
  mark: container("mark", "Mark", "highlight", "inline", {
    children: "Highlighted",
    className: "bg-yellow-300 text-black",
  }),
  small: container("small", "Small", "small", "inline", { children: "Small text" }),
  sub: container("sub", "Subscript", "subscript", "inline", { children: "sub" }),
  sup: container("sup", "Superscript", "superscript", "inline", { children: "sup" }),
  code: container("code", "Code", "code", "inline", { children: "code" }),
  kbd: container("kbd", "Keyboard", "keyboard", "inline", {
    children: "Ctrl",
    className: "font-mono",
  }),
  samp: container("samp", "Sample Output", "code", "inline", { children: "sample" }),
  var: container("var", "Variable", "italic", "inline", { children: "variable" }),
  cite: container("cite", "Citation", "citation", "inline", { children: "Citation" }),
  q: container(
    "q",
    "Inline Quote",
    "quotation",
    "inline",
    { children: "Inline quote" },
    [{ key: "cite", label: "Cite" }, ...text()],
  ),
  abbr: container("abbr", "Abbreviation", "abbreviation", "inline", {
    children: "HTML",
    title: "HyperText Markup Language",
  }, [{ key: "title", label: "Title" }, ...text()]),
  dfn: container("dfn", "Definition", "definition", "inline", {
    children: "Definition",
  }),
  data: container("data", "Data", "data", "inline", { children: "42", value: "42" }, [
    { key: "value", label: "Value" },
    ...text(),
  ]),
  time: container(
    "time",
    "Time",
    "clock",
    "inline",
    { children: "1 January 2026", datetime: "2026-01-01" },
    [{ key: "datetime", label: "Datetime" }, ...text()],
  ),
  ruby: container("ruby", "Ruby", "ruby", "inline", {}, structural),
  rt: leaf("rt", "Ruby Text", "term", "inline", { children: "Text" }),
  rp: leaf("rp", "Ruby Fallback", "span", "inline", { children: "(" }),
  bdi: container("bdi", "Bidi Isolate", "bidi", "inline", { children: "Text" }),
  bdo: container(
    "bdo",
    "Bidi Override",
    "bidi",
    "inline",
    { children: "Text" },
    [{ key: "dir", label: "Dir", kind: "select", options: DIR_OPTIONS }, ...text()],
  ),

  img: {
    type: "img",
    title: "Image",
    icon: "image",
    group: "media",
    droppable: false,
    defaultProps: () => ({ src: "public/images/engine.jpg", alt: "image", className: "" }),
    settings: [
      { key: "src", label: "Src" },
      { key: "alt", label: "Alt" },
    ],
  },
  picture: container("picture", "Picture", "image", "media", {}, structural),
  source: leaf("source", "Source", "mediaSource", "media", {}, [
    { key: "src", label: "Src" },
    { key: "type", label: "Type" },
  ]),
  iframe: leaf("iframe", "Frame", "frame", "media", { title: "Frame" }, [
    { key: "src", label: "Src" },
    { key: "title", label: "Title" },
  ]),
  embed: leaf("embed", "Embed", "embed", "media", {}, [
    { key: "src", label: "Src" },
    { key: "type", label: "Type" },
  ]),
  object: leaf("object", "Object", "object", "media", {}, [
    { key: "data", label: "Data" },
    { key: "type", label: "Type" },
  ]),
  video: leaf("video", "Video", "video", "media", {}, [
    { key: "src", label: "Src" },
    { key: "poster", label: "Poster" },
  ]),
  audio: leaf("audio", "Audio", "audio", "media", {}, [{ key: "src", label: "Src" }]),
  track: leaf("track", "Track", "track", "media", { kind: "subtitles" }, [
    { key: "src", label: "Src" },
    { key: "kind", label: "Kind", kind: "select", options: TRACK_KINDS },
  ]),
  map: container("map", "Map", "map", "media", {}, [
    { key: "name", label: "Name" },
    ...structural,
  ]),
  area: leaf("area", "Area", "area", "media", {}, [
    { key: "shape", label: "Shape", kind: "select", options: AREA_SHAPES },
    { key: "coords", label: "Coords" },
    { key: "href", label: "Href" },
    { key: "alt", label: "Alt" },
  ]),

  table: container("table", "Table", "table", "table", {
    className: "border-collapse",
  }, structural),
  caption: leaf("caption", "Caption", "header", "table", { children: "Caption" }),
  colgroup: container("colgroup", "Column Group", "column", "table", {}, [
    { key: "span", label: "Span", kind: "number" },
  ]),
  col: leaf("col", "Column", "column", "table", { span: 1 }, [
    { key: "span", label: "Span", kind: "number" },
  ]),
  thead: container("thead", "Table Head", "tableHead", "table", {}, structural),
  tbody: container("tbody", "Table Body", "tableBody", "table", {}, structural),
  tfoot: container("tfoot", "Table Foot", "tableFoot", "table", {}, structural),
  tr: container("tr", "Table Row", "tableRow", "table", {}, structural),
  th: container("th", "Header Cell", "tableHeader", "table", {
    children: "Header",
    className: "border border-gray-600 p-1",
  }),
  td: container("td", "Data Cell", "tableCell", "table", {
    children: "Cell",
    className: "border border-gray-600 p-1",
  }),

  form: container("form", "Form", "form", "form", {}, [
    { key: "action", label: "Action" },
    { key: "method", label: "Method", kind: "select", options: METHOD_OPTIONS },
    ...text(),
  ]),
  label: container("label", "Label", "label", "form", { children: "Label" }),
  input: leaf("input", "Input", "input", "form", {
    type: "text",
    name: "input",
    placeholder: "Input",
  }, [
    { key: "type", label: "Type", kind: "select", options: INPUT_TYPES },
    { key: "name", label: "Name" },
    { key: "placeholder", label: "Placeholder" },
    { key: "value", label: "Value" },
  ]),
  textarea: leaf("textarea", "Textarea", "textarea", "form", {
    name: "textarea",
    placeholder: "Text",
    rows: 3,
  }, [
    { key: "name", label: "Name" },
    { key: "placeholder", label: "Placeholder" },
    { key: "rows", label: "Rows", kind: "number" },
  ]),
  select: container("select", "Select", "select", "form", { name: "select" }, [
    { key: "name", label: "Name" },
  ]),
  datalist: container("datalist", "Datalist", "select", "form", { id: "datalist" }, [
    { key: "id", label: "Id" },
  ]),
  optgroup: container("optgroup", "Option Group", "optionGroup", "form", { label: "Group" }, [
    { key: "label", label: "Label" },
  ]),
  option: container("option", "Option", "option", "form", {
    value: "option",
    children: "Option",
  }, [{ key: "value", label: "Value" }, ...text("Label")]),
  output: leaf("output", "Output", "output", "form", { children: "Output" }, [
    { key: "name", label: "Name" },
    ...text(),
  ]),
  progress: leaf("progress", "Progress", "progress", "form", { value: 50, max: 100 }, [
    { key: "value", label: "Value", kind: "number" },
    { key: "max", label: "Max", kind: "number" },
  ]),
  meter: leaf("meter", "Meter", "meter", "form", { value: 60, min: 0, max: 100 }, [
    { key: "value", label: "Value", kind: "number" },
    { key: "min", label: "Min", kind: "number" },
    { key: "max", label: "Max", kind: "number" },
  ]),
  fieldset: container("fieldset", "Fieldset", "fieldset", "form", {
    children: "Fieldset",
  }),
  legend: leaf("legend", "Legend", "label", "form", { children: "Legend" }),
  button: container(
    "button",
    "Button Element",
    "button",
    "form",
    { children: "Click", type: "button" },
    [{ key: "type", label: "Type", kind: "select", options: BUTTON_TYPES }, ...text()],
  ),
};

export const paletteGroups: PaletteGroup[] = Object.values(palette).reduce(
  (groups: PaletteGroup[], item) => {
    const last = groups[groups.length - 1];
    if (last && last.id === item.group) last.items.push(item);
    else groups.push({ id: item.group, title: paletteGroupTitles[item.group], items: [item] });
    return groups;
  },
  [],
);

export const isDroppable = (node: Node): boolean => {
  const item = palette[node.type];
  if (item?.droppable === true) return true;
  if (item?.droppable === false) return false;
  return Array.isArray(node.children);
};
