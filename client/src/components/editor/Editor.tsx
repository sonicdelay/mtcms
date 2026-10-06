import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { layouts, loadLayouts } from "../layoutTree";
import type { Node } from "../../models/types";
import { palette, paletteGroups } from "../../routes/dashboard/registry";
import { icons } from "../../routes/dashboard/icons";
import SdTree, {
  type TreeDropTarget,
  type TreeItem,
  type TreeItemState,
} from "../SdTree";
import { isDroppable } from "../../routes/dashboard/registry";
import SdSplitHandle from "../SdSplitHandle";

const DEFAULT_TREE_SHARE = 0.5;
const MIN_TREE_SHARE = 0.15;

/**
 * Every interaction the Editor reports to its host, shaped like a
 * `ComponentEvent`. The host switches on `type` to decide what to do.
 */
export type EditorEvent =
  | { type: "layoutChange"; payload: string }
  | { type: "selectNode"; payload: string | undefined }
  | { type: "moveNode"; payload: { dragId: string; target: TreeDropTarget } }
  | { type: "undo" | "redo" | "resetLayout" };

interface EditorProps {
  selectedLayout: string;
  style?: CSSProperties;
  tree?: Node | null;
  selectedId?: string;
  canUndo: boolean;
  canRedo: boolean;
  onEvent: (event: EditorEvent) => void;
}

interface IconButton {
  key: string;
  label: string;
  Icon: () => ReactNode;
  disabled?: boolean;
  run: () => void;
}

const panelClass =
  "Editor bg-gray-700 border-none flex h-full min-h-0 flex-col";
const toolbarClass = "flex shrink-0 items-center gap-1";
const selectClass =
  "min-w-0 flex-1 rounded border border-gray-600 bg-gray-800 p-1 text-white";
const iconButtonClass =
  "flex size-7 shrink-0 cursor-grab items-center justify-center rounded border border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40";
const paletteItemClass =
  "flex min-w-0 cursor-grab items-center gap-1.5 rounded border border-transparent px-1.5 py-0.5 text-left text-sm text-gray-200 hover:border-gray-600 hover:bg-gray-800 active:cursor-grabbing";
const paletteClass = "flex flex-col gap-0.5 px-1";
const groupTitleClass =
  "px-2 py-1 text-[10px] uppercase tracking-wider text-gray-400";

const labelOf = (item: TreeItem): string => {
  const type = typeof item.type === "string" ? item.type : undefined;
  const title = typeof item.title === "string" ? item.title : undefined;
  return title ?? (type ? palette[type]?.title ?? type : "node");
};

const shortId = (item: TreeItem): string =>
  typeof item.id === "string" ? item.id.slice(0, 6) : "";

const iconProps = {
  viewBox: "0 0 24 24",
  width: 16,
  height: 16,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const IconUndo = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M9 14 4 9l5-5" />
    <path d="M20 20v-5a6 6 0 0 0-6-6H4" />
  </svg>
);

const IconRedo = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="m15 14 5-5-5-5" />
    <path d="M4 20v-5a6 6 0 0 1 6-6h10" />
  </svg>
);

const IconReset = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v6h6" />
  </svg>
);

const IconExport = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M12 3v12" />
    <path d="M7 11l5 5 5-5" />
    <path d="M4 20h16" />
  </svg>
);

const Editor = ({
  selectedLayout,
  style,
  tree,
  selectedId,
  canUndo,
  canRedo,
  onEvent,
}: EditorProps) => {
  const [layoutNames, setLayoutNames] = useState<string[]>([]);
  const [treeShare, setTreeShare] = useState(DEFAULT_TREE_SHARE);
  const columnRef = useRef<HTMLDivElement>(null);

  const resizeTree = (deltaY: number) => {
    const height = columnRef.current?.clientHeight;
    if (!height) return;
    setTreeShare((prev) => {
      const next = prev + deltaY / height;
      const clamped = Math.min(
        1 - MIN_TREE_SHARE,
        Math.max(MIN_TREE_SHARE, next),
      );
      return Math.abs(clamped - prev) < 0.001 ? prev : clamped;
    });
  };

  const exportModel = () => {
    if (!tree) return;
    const blob = new Blob([JSON.stringify(tree, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedLayout || "layout"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const iconButtons: IconButton[] = [
    {
      key: "export",
      label: `Export ${selectedLayout || "layout"} as JSON`,
      Icon: IconExport,
      disabled: !tree,
      run: exportModel,
    },
    {
      key: "undo",
      label: "Undo",
      Icon: IconUndo,
      disabled: !canUndo,
      run: () => onEvent({ type: "undo" }),
    },
    {
      key: "redo",
      label: "Redo",
      Icon: IconRedo,
      disabled: !canRedo,
      run: () => onEvent({ type: "redo" }),
    },
    {
      key: "reset",
      label: "Reset layout",
      Icon: IconReset,
      run: () => onEvent({ type: "resetLayout" }),
    },
  ];

  useEffect(() => {
    loadLayouts().then(() => setLayoutNames(Object.keys(layouts)));
  }, []);

  return (
    <div ref={columnRef} className={panelClass} style={style}>
      <div className={toolbarClass}>
        <select
          className={selectClass}
          value={selectedLayout}
          onChange={(event) =>
            onEvent({ type: "layoutChange", payload: event.target.value })}
        >
          {layoutNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {iconButtons.map(({ key, label, Icon, disabled, run }) => (
          <button
            key={key}
            type="button"
            onClick={run}
            disabled={disabled}
            title={label}
            aria-label={label}
            className={iconButtonClass}
          >
            <Icon />
          </button>
        ))}
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-auto border-t border-white/20"
        style={{ flexBasis: `${treeShare * 100}%`, flexGrow: 0, flexShrink: 0 }}
      >
        {tree
          ? (
            <SdTree
              value={tree}
              selectedId={selectedId}
              onSelect={(item) =>
                onEvent({
                  type: "selectNode",
                  payload: typeof item.id === "string" ? item.id : undefined,
                })}
              onMove={(dragKey, target) => {
                if (dragKey !== target.parentKey) {
                  onEvent({
                    type: "moveNode",
                    payload: { dragId: dragKey, target },
                  });
                }
              }}
              canDropInside={(item) =>
                typeof item.type === "string" && isDroppable(item as Node)}
              renderIcon={(item) => {
                const type = typeof item.type === "string" ? item.type : "";
                const name = palette[type]?.icon;
                return name ? icons[name]() : null;
              }}
            >
              {(item: TreeItem, state: TreeItemState) => (
                <li
                  className={state.hasChildren
                    ? "text-yellow-200"
                    : "text-gray-300"}
                >
                  <span className="align-middle">{labelOf(item)}</span>
                  {shortId(item) && (
                    <span className="ml-1 align-middle text-[10px] text-gray-500">
                      {shortId(item)}
                    </span>
                  )}
                </li>
              )}
            </SdTree>
          )
          : <p className="text-sm">Loading layouts...</p>}
      </div>

      <SdSplitHandle
        label="Resize tree and component list"
        sign={1}
        orientation="horizontal"
        onResize={resizeTree}
        onReset={() => setTreeShare(DEFAULT_TREE_SHARE)}
      />

      <div className="min-h-0 flex-1 overflow-auto py-1">
        {paletteGroups.map((group) => (
          <div key={group.id} className="mb-1">
            <h4 className={groupTitleClass}>{group.title}</h4>
            <div className={paletteClass}>
              {group.items.map((item) => {
                const ItemIcon = icons[item.icon];
                return (
                  <button
                    key={item.type}
                    type="button"
                    draggable
                    title={item.title}
                    aria-label={item.title}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("component-type", item.type);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className={paletteItemClass}
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      <ItemIcon />
                    </span>
                    <span className="truncate">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Editor;
