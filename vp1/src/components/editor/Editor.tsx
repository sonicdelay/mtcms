import { type CSSProperties, useEffect, useRef, useState } from "react";
import { layouts, loadLayouts } from "../../layoutTree";
import type { Node } from "../../types";
import { palette, paletteGroups } from "../../editor/registry";
import { icons } from "../../editor/icons";
import SdTree, {
  type TreeDropTarget,
  type TreeItem,
  type TreeItemState,
} from "../SdTree";
import { isDroppable } from "../../editor/registry";
import { sdButtonObject } from "../SdButton";
import SdSplitHandle from "../SdSplitHandle";

const DEFAULT_TREE_SHARE = 0.5;
const MIN_TREE_SHARE = 0.15;

interface EditorProps {
  selectedLayout: string;
  onLayoutChange: (name: string) => void;
  style?: CSSProperties;
  tree?: Node | null;
  selectedId?: string;
  onSelectNode?: (id: string | undefined) => void;
  onMoveNode?: (dragId: string, target: TreeDropTarget) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetLayout: () => void;
}

const sendAction = (type: string, payload?: unknown) => {
  globalThis.sd.dispatchAction({ type, payload });
};

const onButtonClicked = (action: { type: string; payload?: unknown }) => {
  console.log("Action received:", action);
};

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
  onLayoutChange,
  style,
  tree,
  selectedId,
  onSelectNode,
  onMoveNode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetLayout,
}: EditorProps) => {
  const [handlerCount, setHandlerCount] = useState(0);
  const [handlers, setHandlers] = useState(() => globalThis.sd.listHandlers());
  const [layoutNames, setLayoutNames] = useState<string[]>([]);
  const [treeShare, setTreeShare] = useState(DEFAULT_TREE_SHARE);
  const columnRef = useRef<HTMLDivElement>(null);

  const resizeTree = (deltaY: number) => {
    const height = columnRef.current?.clientHeight;
    if (!height) return;
    setTreeShare((prev) => {
      const next = prev + deltaY / height;
      const clamped = Math.min(1 - MIN_TREE_SHARE, Math.max(MIN_TREE_SHARE, next));
      return Math.abs(clamped - prev) < 0.001 ? prev : clamped;
    });
  };

  const refreshHandlers = () => {
    setHandlerCount(globalThis.sd.getHandlerCount());
    setHandlers(globalThis.sd.listHandlers());
  };

  const addHandler = () => {
    refreshHandlers();
    globalThis.sd.addHandler("logger", "button_click", onButtonClicked);
  };

  const removeHandler = () => {
    refreshHandlers();
    globalThis.sd.removeHandler();
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

  useEffect(() => {
    globalThis.sd.resetHandlerState();
    refreshHandlers();
    loadLayouts().then(() => setLayoutNames(Object.keys(layouts)));
  }, []);

  return (
    <div
      ref={columnRef}
      className="Editor bg-gray-700 border-none flex h-full min-h-0 flex-col"
      style={style}
    >
      <div className="flex shrink-0 items-center gap-1">
        <select
          className="min-w-0 flex-1 rounded border border-gray-600 bg-gray-800 p-1 text-white"
          value={selectedLayout}
          onChange={(event) => onLayoutChange(event.target.value)}
        >
          {layoutNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={exportModel}
          disabled={!tree}
          aria-label="Export model"
          title={`Export ${selectedLayout || "layout"} as JSON`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-600 bg-gray-800 p-1 text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconExport />
        </button>
        {
          /* <h3>Editor (F8)</h3>
        <button onClick={() => sendAction("button_click", "Button clicked!")}>
          Clicked
        </button>
        <button onClick={() => sendAction("button_click", "Button fired!")}>
          Fired
        </button>
        <img
          src={sdButtonObject.image}
          alt={sdButtonObject.name}
          title={sdButtonObject.tooltip}
        />

        <button onClick={addHandler}>+ Handler</button>
        <button onClick={removeHandler}>- Handler</button>
        <p>Active handlers: {handlerCount}</p>
        <ul className="max-h-20 overflow-auto">
          {handlers.map((h) => (
            <li key={`${h.name}-${h.type}`}>{h.name}: {h.type}</li>
          ))}
        </ul>
        <div className="flex items-start justify-end gap-1 pt-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo"
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-600 bg-gray-800 p-1 text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconUndo />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo"
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-600 bg-gray-800 p-1 text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconRedo />
          </button>
          <button
            type="button"
            onClick={onResetLayout}
            aria-label="Reset layout"
            title="Reset layout"
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-600 bg-gray-800 p-1 text-gray-200"
          >
            <IconReset />
          </button>
        </div> */
        }
      </div>

      <div className="flex min-h-0 flex-col overflow-hidden border-t border-white/20"
        style={{ flexBasis: `${treeShare * 100}%`, flexGrow: 0, flexShrink: 0 }}
      >
        {/* <label className="block text-sm bg-gray-700">Layout Tree</label> */}
        <div className="min-h-0 flex-1 overflow-auto">
          {tree
            ? (
              <SdTree
                data={tree}
                selectedId={selectedId}
                onSelect={(item) =>
                  onSelectNode?.(
                    typeof item.id === "string" ? item.id : undefined,
                  )}
                onMove={(dragKey, target) => {
                  if (dragKey !== target.parentKey) {
                    onMoveNode?.(dragKey, target);
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
      </div>
      <SdSplitHandle
        label="Resize tree and component list"
        sign={1}
        orientation="horizontal"
        onResize={resizeTree}
        onReset={() => setTreeShare(DEFAULT_TREE_SHARE)}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-auto py-1">
          {paletteGroups.map((group) => (
            <div key={group.id} className="mb-1">
              <h4 className="px-2 py-1 text-[10px] uppercase tracking-wider text-gray-400">
                {group.title}
              </h4>
              <ul>
                {group.items.map((item) => {
                  const ItemIcon = icons[item.icon];
                  return (
                    <li
                      key={item.type}
                      draggable
                      title={item.type}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("component-type", item.type);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      className="flex cursor-grab items-center gap-2 px-2 py-1 text-sm text-gray-200 hover:bg-gray-800"
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        <ItemIcon />
                      </span>
                      <span className="truncate">{item.title}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Editor;
