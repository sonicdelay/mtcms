import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  IxButton,
  IxContentHeader,
  IxSelect,
  IxSelectItem,
  showToast,
} from "@siemens/ix-react";
import { iconAdd, iconSaveAll, iconTrashcan } from "@siemens/ix-icons/icons";
import { useAppStore } from "../../lib/app.store";
import { useEditStore } from "../../lib/edit.store";
import NodeBreadcrumb from "./edit/node-breadcrumb";
import NodeTree from "./edit/node-tree";
import DynamicForm from "./edit/dynamic-form";

const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

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

  useEffect(() => {
    if (!token) return;
    void fetchNode(nodeId);
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
        await fetchNode(node.id);
        showToast({ title: "Node created", type: "success" });
      } else {
        showToast({ title: "Could not create node", type: "error" });
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
      showToast(
        ok
          ? { title: "Node saved", type: "success" }
          : { title: "Could not save node", type: "error" },
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
        showToast({ title: "Node deleted", type: "info" });
      } else {
        showToast({ title: "Could not delete node", type: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="admin-page admin-page--edit">
      <IxContentHeader headerTitle="Edit" headerSubtitle={node?.id ?? ""} />

      <NodeBreadcrumb />

      <div className="admin-edit-layout">
        <aside className="admin-edit-layout__tree">
          <NodeTree />
        </aside>

        <main className="admin-edit-layout__content">
          {loading && <p style={{ opacity: 0.7 }}>Loading…</p>}
          {!loading && !node && <p>Node not found.</p>}

          {node && (
            <>
              <div className="admin-page__toolbar">
                <IxSelect
                  value={language}
                  onValueChange={(value) => setLanguage(String(value) as "en" | "de")}
                >
                  <IxSelectItem value="en">English</IxSelectItem>
                  <IxSelectItem value="de">Deutsch</IxSelectItem>
                </IxSelect>
                <IxButton
                  icon={iconAdd}
                  onClick={() => void handleAddChild()}
                  disabled={busy}
                >
                  Add child
                </IxButton>
                <IxButton
                  icon={iconSaveAll}
                  onClick={() => void handleSave()}
                  disabled={busy}
                >
                  Save
                </IxButton>
                {!isRoot && (
                  <IxButton
                    variant="secondary"
                    icon={iconTrashcan}
                    onClick={() => void handleDelete()}
                    disabled={busy}
                  >
                    Delete
                  </IxButton>
                )}
              </div>

              <DynamicForm />
            </>
          )}
        </main>
      </div>
    </div>
  );
}