import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAppStore } from "../../lib/app.store";
import { getNodes, nodeTitle } from "../../lib/admin.api";
import type { Node } from "../../lib/types";
import SdPageHeader from "../../components/SdPageHeader";
import SdSelect from "../../components/SdSelect";
import SdCard from "../../components/SdCard";
import { SdIcon, type SdIconName } from "../../components/icons";

const ICON_BY_NAME: Record<string, SdIconName> = {
  root: "circle",
  node: "node",
  trash: "trash",
  user: "user",
};

const ICON_BY_TYPE: Record<string, SdIconName> = {
  node: "node",
  system: "node",
  type: "circle",
  area: "node",
  facility: "file",
  language: "file",
  user: "user",
  users: "user",
  root: "circle",
  trash: "trash",
};

function iconFor(node: Node): SdIconName {
  const name = (node.data as { "0"?: { icon?: string } })?.["0"]?.icon;
  return ICON_BY_NAME[name ?? ""] ?? ICON_BY_TYPE[node.type] ?? "file";
}

export default function ToolsPage() {
  const token = useAppStore((s) => s.token);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedType, setSelectedType] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getNodes(token)
      .then((rows) => {
        if (!cancelled) setNodes(rows);
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const types = useMemo(
    () => [...new Set(nodes.map((n) => n.type))].sort(),
    [nodes],
  );

  const tools = useMemo(() => {
    const list = selectedType === "all"
      ? nodes
      : nodes.filter((n) => n.type === selectedType);
    return [...list].sort((a, b) => b.update.localeCompare(a.update));
  }, [nodes, selectedType]);

  return (
    <div className="admin-page">
      <SdPageHeader
        value="Tools"
        subtitle={`${tools.length} tools derived from node data`}
      />

      <div className="admin-page__toolbar">
        <SdSelect
          value={selectedType}
          options={[
            { value: "all", label: "All types" },
            ...types.map((type) => ({ value: type, label: type })),
          ]}
          onChange={(ev) =>
            setSelectedType(
              String((ev.payload as { value?: string } | undefined)?.value ?? ""),
            )}
        />
      </div>

      {error && (
        <p className="text-[var(--danger-fg)]">{error}</p>
      )}

      <div className="admin-grid">
        {tools.map((node) => (
          <Link
            key={node.id}
            to={`/admin/tasks`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <SdCard value={nodeTitle(node)}>
              <div className="mb-1 flex items-center gap-1.5 text-sm opacity-75">
                <SdIcon name={iconFor(node)} size={14} />
                {node.type}
              </div>
              <p style={{ margin: 0, opacity: 0.75 }}>
                Updated {new Date(node.update).toLocaleDateString()}
              </p>
            </SdCard>
          </Link>
        ))}
        {tools.length === 0 && <p style={{ opacity: 0.7 }}>No tools found.</p>}
      </div>
    </div>
  );
}
