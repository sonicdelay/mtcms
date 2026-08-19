import { useEffect, useMemo, useState } from "react";
import {
  IxButton,
  IxCheckbox,
  IxContentHeader,
  IxInput,
  IxSelect,
  IxSelectItem,
  showToast,
} from "@siemens/ix-react";
import { iconAdd, iconTrashcan } from "@siemens/ix-icons/icons";
import { useAppStore } from "../../lib/app.store";
import {
  createNode,
  deleteNode,
  getNodes,
  nodeTitle,
  updateNode,
} from "../../lib/admin.api";
import type { Node } from "../../lib/types";

const PROTECTED = new Set([
  "00000000-0000-4000-8000-000000000000",
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
]);

interface TaskView {
  node: Node;
  done: boolean;
}

export default function TasksPage() {
  const token = useAppStore((s) => s.token);
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [filter, setFilter] = useState("all");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("node");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const run = async () => {
      try {
        const nodes = await getNodes(token);
        if (cancelled) return;
        setTasks(
          nodes.map((node) => {
            const root = node.data as {
              "0"?: { values?: { en?: { done?: unknown } } };
            };
            const done = root?.["0"]?.values?.en?.done === true;
            return { node, done };
          }),
        );
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  const types = useMemo(() => {
    return [...new Set(tasks.map((t) => t.node.type))].sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    const list =
      filter === "all" ? tasks : tasks.filter((t) => t.node.type === filter);
    return [...list].sort((a, b) => b.node.update.localeCompare(a.node.update));
  }, [tasks, filter]);

  const addTask = async () => {
    if (!token) return;
    const title = newTitle.trim();
    if (!title) return;
    try {
      await createNode(token, {
        type: newType,
        data: {
          "0": {
            title,
            icon: "node",
            meta: {},
            values: { en: { done: false } },
            position: 10,
            protected: false,
            reviewGroup: "0",
          },
        },
      });
      setNewTitle("");
      setReloadKey((k) => k + 1);
      showToast({ title: "Task created", type: "success" });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const toggleDone = async (task: TaskView) => {
    if (!token) return;
    const next = !task.done;
    try {
      const root = (task.node.data ?? {}) as Record<string, unknown>;
      const zero = (root["0"] ?? {}) as Record<string, unknown>;
      const values = (zero["values"] ?? {}) as Record<string, unknown>;
      await updateNode(token, task.node.id, {
        data: {
          ...root,
          "0": {
            ...zero,
            values: { ...values, en: { ...(values["en"] ?? {}), done: next } },
          },
        },
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.node.id === task.node.id ? { ...t, done: next } : t,
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const removeTask = async (task: TaskView) => {
    if (!token || PROTECTED.has(task.node.id)) return;
    try {
      await deleteNode(token, task.node.id);
      setTasks((prev) => prev.filter((t) => t.node.id !== task.node.id));
      showToast({ title: "Task deleted", type: "info" });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="admin-page">
      <IxContentHeader
        headerTitle="Tasklist"
        headerSubtitle={`${filtered.length} of ${tasks.length} nodes`}
      />

      <div className="admin-page__toolbar">
        <IxInput
          placeholder="New task title…"
          value={newTitle}
          onInput={(event) =>
            setNewTitle((event.target as HTMLInputElement).value)
          }
        />
        <IxSelect
          value={newType}
          onValueChange={(value) => setNewType(String(value))}
        >
          {types.map((type) => (
            <IxSelectItem key={type} value={type}>
              {type}
            </IxSelectItem>
          ))}
          {types.length === 0 && <IxSelectItem value="node">node</IxSelectItem>}
        </IxSelect>
        <IxButton icon={iconAdd} onClick={addTask}>
          Add
        </IxButton>
      </div>

      <div className="admin-page__toolbar">
        <IxSelect
          value={filter}
          onValueChange={(value) => setFilter(String(value))}
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

      <div>
        {filtered.map((task) => (
          <div key={task.node.id} className="admin-row">
            <IxCheckbox
              checked={task.done}
              onCheckedChange={() => toggleDone(task)}
            />
            <div className="admin-row__main">
              <div
                className="admin-row__title"
                style={{
                  textDecoration: task.done ? "line-through" : "none",
                  opacity: task.done ? 0.6 : 1,
                }}
              >
                {nodeTitle(task.node)}
              </div>
              <div className="admin-row__meta">
                {task.node.type} · {new Date(task.node.update).toLocaleString()}
              </div>
            </div>
            {!PROTECTED.has(task.node.id) && (
              <IxButton
                variant="secondary"
                icon={iconTrashcan}
                onClick={() => removeTask(task)}
              >
                Delete
              </IxButton>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ opacity: 0.7 }}>No tasks found.</p>
        )}
      </div>
    </div>
  );
}