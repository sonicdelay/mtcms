import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../lib/app.store";
import {
  createNode,
  deleteNode,
  getNodes,
  nodeTitle,
  updateNode,
} from "../../lib/admin.api";
import type { Node } from "../../lib/types";
import { toast } from "../../lib/toast.store";
import SdPageHeader from "../../components/SdPageHeader";
import SdInput from "../../components/SdInput";
import SdSelect from "../../components/SdSelect";
import SdCheckbox from "../../components/SdCheckbox";
import SdButton from "../../components/SdButton";

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
    const list = filter === "all"
      ? tasks
      : tasks.filter((t) => t.node.type === filter);
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
      toast("Task created", "success");
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
        prev.map((t) => t.node.id === task.node.id ? { ...t, done: next } : t)
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
      toast("Task deleted", "info");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="admin-page">
      <SdPageHeader
        value="Tasklist"
        subtitle={`${filtered.length} of ${tasks.length} nodes`}
      />

      <div className="admin-page__toolbar">
        <SdInput
          placeholder="New task title…"
          value={newTitle}
          onChange={(ev) =>
            setNewTitle(
              String((ev.payload as { value?: string } | undefined)?.value ?? ""),
            )}
        />
        <SdSelect
          value={newType}
          options={(types.length > 0 ? types : ["node"]).map((type) => ({
            value: type,
            label: type,
          }))}
          onChange={(ev) =>
            setNewType(
              String((ev.payload as { value?: string } | undefined)?.value ?? ""),
            )}
        />
        <SdButton icon="plus" onClick={addTask}>
          Add
        </SdButton>
      </div>

      <div className="admin-page__toolbar">
        <SdSelect
          value={filter}
          options={[
            { value: "all", label: "All types" },
            ...types.map((type) => ({ value: type, label: type })),
          ]}
          onChange={(ev) =>
            setFilter(
              String((ev.payload as { value?: string } | undefined)?.value ?? ""),
            )}
        />
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      )}

      <div>
        {filtered.map((task) => (
          <div key={task.node.id} className="admin-row">
            <SdCheckbox
              value={task.done}
              onChange={() => toggleDone(task)}
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
              <SdButton
                variant="secondary"
                icon="trash"
                onClick={() => removeTask(task)}
              >
                Delete
              </SdButton>
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
