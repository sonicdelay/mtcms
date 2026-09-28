import { useEffect, useState } from "react";
import type { Node } from "../../layoutTypes";
import { palette, type ConfigField } from "../../editor/registry";

interface ConfigProps {
  tree: Node;
  selected: Node | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<Node>) => void;
  onApplySelectedJson: (parsed: Record<string, unknown>) => void;
  onApplyTreeJson: (json: string) => void;
}

interface FieldProps {
  field: ConfigField;
  node: Node;
  onPatch: (patch: Partial<Node>) => void;
}

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

function IconArrowUp() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M19 12l-7 7-7-7" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconScreen() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 22h8" />
      <path d="M12 18v4" />
    </svg>
  );
}

function FieldInput({ field, node, onPatch }: FieldProps) {
  const value = node[field.key];
  const baseClass = "w-full p-1 bg-gray-800 text-white border border-gray-600 rounded";
  switch (field.kind) {
    case "select": {
      const options = field.options ?? [];
      const str = value === undefined ? "" : String(value);
      const known = options.includes(str);
      return (
        <select
          className={baseClass}
          value={str}
          onChange={(e) => onPatch({ [field.key]: e.target.value } as Partial<Node>)}
        >
          {value === undefined && <option value="">—</option>}
          {!known && <option value={str}>{str}</option>}
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }
    case "number":
      return (
        <input
          type="number"
          className={baseClass}
          value={value === undefined || value === "" ? "" : Number(value)}
          onChange={(e) => {
            const v = e.target.value;
            onPatch({ [field.key]: v === "" ? "" : Number(v) } as Partial<Node>);
          }}
        />
      );
    case "textarea":
      return (
        <textarea
          className={baseClass}
          rows={3}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onPatch({ [field.key]: e.target.value } as Partial<Node>)}
        />
      );
    default:
      return (
        <input
          type="text"
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onPatch({ [field.key]: e.target.value } as Partial<Node>)}
        />
      );
  }
}

export default function Config({
  tree,
  selected,
  canMoveUp,
  canMoveDown,
  onMove,
  onDuplicate,
  onDelete,
  onUpdate,
  onApplySelectedJson,
  onApplyTreeJson,
}: ConfigProps) {
  const [nodeJson, setNodeJson] = useState("");
  const [treeJson, setTreeJson] = useState("");
  const [jsonError, setJsonError] = useState<string | undefined>(undefined);

  useEffect(() => {
    setNodeJson(selected ? JSON.stringify(selected, null, 2) : "");
  }, [selected?.id]);

  useEffect(() => {
    setTreeJson(JSON.stringify(tree, null, 2));
  }, [tree]);

  const item = selected ? palette[selected.type] : undefined;

  const applyNodeJson = () => {
    if (!selected) return;
    try {
      onApplySelectedJson(JSON.parse(nodeJson) as Record<string, unknown>);
      setJsonError(undefined);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const applyTreeJson = () => {
    try {
      onApplyTreeJson(treeJson);
      setJsonError(undefined);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const inputClass = "w-full p-1 bg-gray-800 text-white border border-gray-600 rounded";
  const buttonClass =
    "p-1 bg-gray-800 text-white border border-gray-600 rounded flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="Config bg-gray-700 border-none">
      <h3>Config</h3>
      {selected ? (
        <>
          <div className="text-sm"><b>Type:</b> {selected.type}</div>
          {(item?.settings ?? []).map((field) => (
            <label key={field.key} className="block text-sm mt-2">
              {field.label}
              <FieldInput field={field} node={selected} onPatch={onUpdate} />
            </label>
          ))}
          <label className="block text-sm mt-2">
            className
            <textarea
              className={inputClass}
              rows={3}
              value={typeof selected.className === "string" ? selected.className : ""}
              onChange={(e) => onUpdate({ className: e.target.value })}
            />
          </label>
          <div className="flex gap-1 mt-2">
            <button
              className={buttonClass}
              onClick={() => onMove(-1)}
              disabled={!canMoveUp}
              title="Move Up"
              aria-label="Move Up"
            >
              <IconArrowUp />
            </button>
            <button
              className={buttonClass}
              onClick={() => onMove(1)}
              disabled={!canMoveDown}
              title="Move Down"
              aria-label="Move Down"
            >
              <IconArrowDown />
            </button>
            <button
              className={buttonClass}
              onClick={onDuplicate}
              title="Duplicate"
              aria-label="Duplicate"
            >
              <IconCopy />
            </button>
            <button
              className={buttonClass}
              onClick={onDelete}
              title="Delete"
              aria-label="Delete"
            >
              <IconTrash />
            </button>
          </div>
          <br />
          <label className="block text-sm">
            JSON (selected)
            <textarea
              className={inputClass}
              rows={9}
              value={nodeJson}
              onChange={(e) => setNodeJson(e.target.value)}
            />
          </label>
          <button
            className={`${buttonClass} mt-1`}
            onClick={applyNodeJson}
            title="Apply JSON"
            aria-label="Apply JSON"
          >
            <IconCheck />
          </button>
        </>
      ) : (
        <p className="text-sm mt-1">Select an element on the canvas.</p>
      )}
      <br />
      <label className="block text-sm mt-2">
        JSON (screen)
        <textarea
          className={inputClass}
          rows={10}
          value={treeJson}
          onChange={(e) => setTreeJson(e.target.value)}
        />
      </label>
      <button
        className={`${buttonClass} mt-1`}
        onClick={applyTreeJson}
        title="Apply Screen JSON"
        aria-label="Apply Screen JSON"
      >
        <IconScreen />
      </button>
      {jsonError && <p className="text-red-400 text-xs mt-1">{jsonError}</p>}
    </div>
  );
}