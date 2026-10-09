import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import type { Node } from "../../models/types";
import { type ConfigField, palette } from "../../routes/dashboard/registry";
import SdDummy from "../SdDummy";
import type { SdComponentEvent } from "../../models/component-event";

interface ConfigProps {
  tree: Node;
  selected: Node | null;
  style?: CSSProperties;
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

const IconArrowUp = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
);

const IconArrowDown = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M12 5v14" />
    <path d="M19 12l-7 7-7-7" />
  </svg>
);

const IconCopy = () => (
  <svg {...iconProps} aria-hidden="true">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </svg>
);

const IconTrash = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconCheck = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const IconScreen = () => (
  <svg {...iconProps} aria-hidden="true">
    <rect x="2" y="4" width="20" height="14" rx="2" />
    <path d="M8 22h8" />
    <path d="M12 18v4" />
  </svg>
);

const IconChevron = ({ open }: { open: boolean }) => (
  <svg
    {...iconProps}
    aria-hidden="true"
    className={`transition-transform ${open ? "rotate-90" : ""}`}
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
);

interface JsonSectionProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  rows: number;
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  applyTitle: string;
  applyIcon: ReactNode;
  inputClass: string;
  buttonClass: string;
}

const JsonSection = ({
  label,
  open,
  onToggle,
  rows,
  value,
  onChange,
  onApply,
  applyTitle,
  applyIcon,
  inputClass,
  buttonClass,
}: JsonSectionProps) => (
  <div className="mt-2">
    <button
      type="button"
      className="w-full flex items-center gap-1 text-sm text-left hover:text-[var(--fg)]"
      onClick={onToggle}
      title={open ? `Collapse ${label}` : `Expand ${label}`}
      aria-expanded={open}
    >
      <IconChevron open={open} />
      {label}
    </button>
    {open && (
      <div className="mt-1">
        <textarea
          className={inputClass}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          className={`${buttonClass} mt-1`}
          onClick={onApply}
          title={applyTitle}
          aria-label={applyTitle}
        >
          {applyIcon}
        </button>
      </div>
    )}
  </div>
);

const readPath = (node: Node, path: string): unknown =>
  path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, node);

const writePath = (node: Node, path: string, value: unknown): Partial<Node> => {
  const keys = path.split(".");
  const root = { ...node } as Record<string, unknown>;
  let cursor = root;
  for (const key of keys.slice(0, -1)) {
    const current = cursor[key];
    const next = current !== null && typeof current === "object"
      ? { ...(current as Record<string, unknown>) }
      : {};
    cursor[key] = next;
    cursor = next;
  }
  cursor[keys[keys.length - 1]] = value;
  return root as Partial<Node>;
};

const FieldInput = ({ field, node, onPatch }: FieldProps) => {
  const value = readPath(node, field.key);
  const baseClass =
    "w-full p-1 bg-[var(--input-bg)] text-[var(--input-fg)] border border-[var(--border-strong)] rounded";
  switch (field.kind) {
    case "select": {
      const options = field.options ?? [];
      const str = value === undefined ? "" : String(value);
      const known = options.includes(str);
      return (
        <select
          className={baseClass}
          value={str}
          onChange={(e) =>
            onPatch(writePath(node, field.key, e.target.value))}
        >
          {value === undefined && <option value="">—</option>}
          {!known && <option value={str}>{str}</option>}
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
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
            onPatch(
              writePath(node, field.key, v === "" ? "" : Number(v)),
            );
          }}
        />
      );
    case "textarea":
      return (
        <textarea
          className={baseClass}
          rows={3}
          value={typeof value === "string" ? value : ""}
          onChange={(e) =>
            onPatch(writePath(node, field.key, e.target.value))}
        />
      );
    default:
      return (
        <input
          type="text"
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(e) =>
            onPatch(writePath(node, field.key, e.target.value))}
        />
      );
  }
};

const Config = ({
  tree,
  selected,
  style,
  canMoveUp,
  canMoveDown,
  onMove,
  onDuplicate,
  onDelete,
  onUpdate,
  onApplySelectedJson,
  onApplyTreeJson,
}: ConfigProps) => {
  const [nodeJson, setNodeJson] = useState("");
  const [treeJson, setTreeJson] = useState("");
  const [nodeJsonOpen, setNodeJsonOpen] = useState(false);
  const [treeJsonOpen, setTreeJsonOpen] = useState(false);
  const [jsonError, setJsonError] = useState<string | undefined>(undefined);
  const [dummyEvent, setDummyEvent] = useState<SdComponentEvent>();

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

  const inputClass =
    "w-full p-1 bg-[var(--input-bg)] text-[var(--input-fg)] border border-[var(--border-strong)] rounded";
  const buttonClass =
    "p-1 bg-[var(--input-bg)] text-[var(--input-fg)] border border-[var(--border-strong)] rounded flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div
      className="Config border-none bg-[var(--panel-background)] text-[var(--fg-base)]"
      style={style}
    >
      <h3>Config</h3>
      {selected
        ? (
          <>
            <div className="text-sm">
              <b>Type:</b> {selected.type}
            </div>
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
                value={typeof selected.className === "string"
                  ? selected.className
                  : ""}
                onChange={(e) => onUpdate({ className: e.target.value })}
              />
            </label>
            <div className="flex gap-1 mt-2">
              <button
                className={buttonClass}
                onClick={() =>
                  onMove(-1)}
                disabled={!canMoveUp}
                title="Move Up"
                aria-label="Move Up"
              >
                <IconArrowUp />
              </button>
              <button
                className={buttonClass}
                onClick={() =>
                  onMove(1)}
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
            <JsonSection
              label="JSON (selected)"
              open={nodeJsonOpen}
              onToggle={() => setNodeJsonOpen((v) => !v)}
              rows={9}
              value={nodeJson}
              onChange={setNodeJson}
              onApply={applyNodeJson}
              applyTitle="Apply JSON"
              applyIcon={<IconCheck />}
              inputClass={inputClass}
              buttonClass={buttonClass}
            />
          </>
        )
        : <p className="text-sm mt-1">Select an element on the canvas.</p>}
      <JsonSection
        label="JSON (screen)"
        open={treeJsonOpen}
        onToggle={() => setTreeJsonOpen((v) => !v)}
        rows={10}
        value={treeJson}
        onChange={setTreeJson}
        onApply={applyTreeJson}
        applyTitle="Apply Screen JSON"
        applyIcon={<IconScreen />}
        inputClass={inputClass}
        buttonClass={buttonClass}
      />
      {jsonError && (
        <p className="text-[var(--danger-fg)] text-xs mt-1">{jsonError}</p>
      )}

      <SdDummy
        value="someValue"
        config={{ type: "experimental" }}
        eventIn={dummyEvent}
        onChange={(e) => console.log("Event triggered", e)}
        className="border-2"
      >
        <span>Hallo Welt</span>
      </SdDummy>
      <button
        className={buttonClass}
        onClick={() => {
          console.log("Button clicked");
          setDummyEvent({ type: "test", payload: { value: "someValue" } });
        }}
        title="Test Button"
        aria-label="Test Button"
      >
        Test
      </button>
      <button
        className={buttonClass}
        onClick={() => {
          console.log("Button clicked");
          setDummyEvent({ type: "test2", payload: { value: "WTF !!!" } });
        }}
        title="Test Button"
        aria-label="Test Button"
      >
        Test2
      </button>
    </div>
  );
};

export default Config;
