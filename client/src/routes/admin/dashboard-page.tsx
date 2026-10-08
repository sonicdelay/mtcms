import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAppStore } from "../../lib/app.store";
import { getNodes } from "../../lib/admin.api";
import type { FileItem, Node } from "../../lib/types";
import SdPageHeader from "../../components/SdPageHeader";
import SdKpi from "../../components/SdKpi";
import SdCard from "../../components/SdCard";

export default function DashboardPage() {
  const token = useAppStore((s) => s.token);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [nodeRows, fileRows] = await Promise.all([
          getNodes(token),
          fetch("/api/fm", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => (res.ok ? res.json() : [])) as Promise<FileItem[]>,
        ]);
        if (!cancelled) {
          setNodes(nodeRows);
          setFiles(fileRows);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of nodes) {
      counts.set(node.type, (counts.get(node.type) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [nodes]);

  const recentNodes = useMemo(() => {
    return [...nodes]
      .sort((a, b) => b.update.localeCompare(a.update))
      .slice(0, 5);
  }, [nodes]);

  if (error) {
    return (
      <div className="admin-page">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <SdPageHeader value="Dashboard" subtitle="mtCMS overview" />
      <div className="admin-page__toolbar">
        <SdKpi label="Total nodes" value={nodes.length} />
        <SdKpi label="Node types" value={typeCounts.length} />
        <SdKpi label="Media files" value={files.length} />
        <SdKpi label="Status" value="OK" />
      </div>

      <div className="admin-grid">
        <SdCard value="Node types">
          <div style={{ display: "grid", gap: "0.35rem" }}>
            {typeCounts.map(([type, count]) => (
              <div key={type} className="admin-row">
                <span className="admin-row__title">{type}</span>
                <span className="admin-row__meta">{count} nodes</span>
              </div>
            ))}
            {typeCounts.length === 0 && (
              <p style={{ margin: 0, opacity: 0.7 }}>No nodes yet.</p>
            )}
          </div>
        </SdCard>

        <SdCard value="Recently updated">
          <div style={{ display: "grid", gap: "0.35rem" }}>
            {recentNodes.map((node) => (
              <Link
                key={node.id}
                to={`/admin/tasks`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="admin-row">
                  <span className="admin-row__title">
                    {(node.data as { "0"?: { title?: string } })?.["0"]
                      ?.title ?? node.type}
                  </span>
                  <span className="admin-row__meta">
                    {new Date(node.update).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
            {recentNodes.length === 0 && (
              <p style={{ margin: 0, opacity: 0.7 }}>No nodes yet.</p>
            )}
          </div>
        </SdCard>
      </div>
    </div>
  );
}
