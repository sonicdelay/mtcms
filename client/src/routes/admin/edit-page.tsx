import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppStore } from "../../lib/app.store";
import { useEditStore } from "../../lib/edit.store";
import { toast } from "../../lib/toast.store";
import NodeBreadcrumb from "../../components/edit/node-breadcrumb";
import NodeTree from "../../components/edit/node-tree";
import DynamicForm from "../../components/edit/dynamic-form";
import SdPageHeader from "../../components/SdPageHeader";
import SdSelect from "../../components/SdSelect";
import SdButton from "../../components/SdButton";

const ZERO_UUID = "00000000-0000-4000-8000-000000000000";
const MIN_TREE_WIDTH = 180;
const MAX_TREE_WIDTH = 640;

function useTreeWidth(initial = 300) {
  const [width, setWidth] = useState(initial);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const left = containerRef.current.getBoundingClientRect().left;
      setWidth(
        Math.min(
          MAX_TREE_WIDTH,
          Math.max(MIN_TREE_WIDTH, event.clientX - left),
        ),
      );
    };
    const up = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return {
    width,
    containerRef,
    onPointerDown: (event: React.PointerEvent) => {
      event.preventDefault();
      draggingRef.current = true;
    },
  };
}

export default function EditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const nodeId = id ?? ZERO_UUID;

  const token = useAppStore((s) => s.token);
  const node = useEditStore((s) => s.node);
  const loading = useEditStore((s) => s.loading);
  const language = useEditStore((s) => s.language);
  const setLanguage = useEditStore((s) => s.setLanguage);
  const fetchNode = useEditStore((s) => s.fetchNode);
  const addNode = useEditStore((s) => s.addNode);
  const saveNode = useEditStore((s) => s.saveNode);
  const deleteNode = useEditStore((s) => s.deleteNode);

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const tree = useTreeWidth();

  useEffect(() => {
    if (token) void fetchNode(nodeId);
  }, [token, nodeId, fetchNode]);

  useEffect(() => {
    if (!node) return;
    const root = (node.data as { "0"?: { title?: string } } | null)?.["0"];
    setName(root?.title ?? "");
  }, [node]);

  const isRoot = node?.id === ZERO_UUID;

  const handleAddChild = async () => {
    if (!node?.id || busy) return;
    const childName = globalThis.prompt("New node name:");
    if (!childName?.trim()) return;
    setBusy(true);
    try {
      const createdId = await addNode(
        node.id,
        childName.trim(),
        "node",
        language,
      );
      if (createdId) {
        await fetchNode(node.id, true);
        toast("Node created", "success");
      } else {
        toast("Could not create node", "error");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await saveNode();
      toast(
        ok ? "Node saved" : "Could not save node",
        ok ? "success" : "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!node?.id || isRoot || busy) return;
    if (!globalThis.confirm(`Delete node "${name}"?`)) return;
    setBusy(true);
    try {
      const parentId = await deleteNode();
      if (parentId) {
        navigate(`/admin/edit/${encodeURIComponent(parentId)}`);
        void fetchNode(parentId);
        toast("Node deleted", "info");
      } else {
        toast("Could not delete node", "error");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!token) return null;

  return (
    <div className="admin-page admin-page--edit">
      <SdPageHeader value={`Edit ( id=${node?.id ?? ""} )`}>
        <div className="admin-page__toolbar">
          <SdSelect
            value={language}
            options={[
              { value: "en", label: "English" },
              { value: "de", label: "Deutsch" },
            ]}
            onChange={(ev) =>
              setLanguage(
                ((ev.payload as { value?: string } | undefined)?.value ??
                  "") as "en" | "de",
              )}
          />
          <SdButton
            icon="plus"
            onClick={() => void handleAddChild()}
            disabled={busy}
          />
          <SdButton
            icon="save"
            onClick={() => void handleSave()}
            disabled={busy}
          />
          {!isRoot && (
            <SdButton
              variant="danger"
              icon="trash"
              onClick={() => void handleDelete()}
              disabled={busy}
            />
          )}
        </div>
      </SdPageHeader>

      <NodeBreadcrumb />

      <div className="admin-edit-layout" ref={tree.containerRef}>
        <aside
          className="admin-edit-layout__tree"
          style={{ width: `${tree.width}px` }}
        >
          <NodeTree />
        </aside>

        <div
          className="admin-edit-layout__splitter"
          role="separator"
          aria-orientation="vertical"
          onPointerDown={tree.onPointerDown}
        />

        <main className="admin-edit-layout__content">
          {loading && <p style={{ opacity: 0.7 }}>Loading…</p>}
          {!loading && !node && <p>Node not found.</p>}

          {node && <DynamicForm />}
        </main>
      </div>
    </div>
  );
}
