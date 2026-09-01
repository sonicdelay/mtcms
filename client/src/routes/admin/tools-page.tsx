import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  IxActionCard,
  IxContentHeader,
  IxSelect,
  IxSelectItem,
} from "@siemens/ix-react";
import {
  iconCircle,
  iconDocument,
  iconElement,
  iconTrashcan,
  iconUser,
} from "@siemens/ix-icons/icons";
import { useAppStore } from "../../lib/app.store";
import { getNodes, nodeTitle } from "../../lib/admin.api";
import type { Node } from "../../lib/types";

const ICON_BY_NAME: Record<string, string> = {
  root: iconCircle,
  node: iconElement,
  trash: iconTrashcan,
  user: iconUser,
};

const ICON_BY_TYPE: Record<string, string> = {
  node: iconElement,
  system: iconElement,
  type: iconCircle,
  area: iconElement,
  facility: iconDocument,
  language: iconDocument,
  user: iconUser,
  users: iconUser,
  root: iconCircle,
  trash: iconTrashcan,
};

function iconFor(node: Node): string {
  const name = (node.data as { "0"?: { icon?: string } })?.["0"]?.icon;
  return ICON_BY_NAME[name ?? ""] ?? ICON_BY_TYPE[node.type] ?? iconDocument;
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
      <IxContentHeader
        headerTitle="Tools"
        headerSubtitle={`${tools.length} tools derived from node data`}
      />

      <div className="admin-page__toolbar">
        <IxSelect
          value={selectedType}
          onValueChange={(value) => setSelectedType(String(value))}
        >
          <IxSelectItem value="all">All types</IxSelectItem>
          {types.map((type) => (
            <IxSelectItem key={type} value={type}>
              {type}
            </IxSelectItem>
          ))}
        </IxSelect>
      </div>

      {error && (
        <p style={{ color: "var(--theme-color-alarm-text)" }}>{error}</p>
      )}

      <div className="admin-grid">
        {tools.map((node) => (
          <Link
            key={node.id}
            to={`/admin/tasks`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <IxActionCard
              icon={iconFor(node)}
              heading={nodeTitle(node)}
              subheading={node.type}
            >
              <p style={{ margin: 0, opacity: 0.75 }}>
                Updated {new Date(node.update).toLocaleDateString()}
              </p>
            </IxActionCard>
          </Link>
        ))}
        {tools.length === 0 && <p style={{ opacity: 0.7 }}>No tools found.</p>}
      </div>
    </div>
  );
}
