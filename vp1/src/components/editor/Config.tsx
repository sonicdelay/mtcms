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
  const buttonClass = "p-1 bg-gray-800 text-white border border-gray-600 rounded";

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
          <div className="flex flex-col gap-1 mt-2">
            <button className={buttonClass} onClick={() => onMove(-1)} disabled={!canMoveUp}>
              Move Up
            </button>
            <button className={buttonClass} onClick={() => onMove(1)} disabled={!canMoveDown}>
              Move Down
            </button>
            <button className={buttonClass} onClick={onDuplicate}>Duplicate</button>
            <button className={buttonClass} onClick={onDelete}>Delete</button>
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
          <button className={buttonClass} onClick={applyNodeJson}>Apply JSON</button>
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
      <button className={buttonClass} onClick={applyTreeJson}>Apply Screen JSON</button>
      {jsonError && <p className="text-red-400 text-xs mt-1">{jsonError}</p>}
    </div>
  );
}