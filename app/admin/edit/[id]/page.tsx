"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IxContentHeader,
  IxIconButton,
  IxSelect,
  IxSelectItem,
  showToast,
} from "@siemens/ix-react";
import {
  iconAdd,
  iconChevronLeft,
  iconSaveAll,
  iconTrashcan,
} from "@siemens/ix-icons/icons";
import { useEditStore } from "../edit.store";
import NodeTree from "../node-tree";
import NodeBreadcrumb from "../node-breadcrumb";
import DynamicForm from "../dynamic-form";

const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const selectedNodeId = useEditStore((state) => state.selectedNodeId);
  const node = useEditStore((state) => state.node);
  const loading = useEditStore((state) => state.loading);
  const tree = useEditStore((state) => state.tree);
  const formFields = useEditStore((state) => state.formFields);
  const language = useEditStore((state) => state.language);
  const setTreeContext = useEditStore((state) => state.setTreeContext);
  const setLanguage = useEditStore((state) => state.setLanguage);
  const setFormFields = useEditStore((state) => state.setFormFields);
  const fetchNode = useEditStore((state) => state.fetchNode);
  const addNode = useEditStore((state) => state.addNode);
  const saveNode = useEditStore((state) => state.saveNode);
  const deleteNode = useEditStore((state) => state.deleteNode);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const run = async () => {
      const data = await fetchNode(id);
      if (active && !data) {
        router.replace(`/admin/edit/${ZERO_UUID}`);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [id, fetchNode, router]);

  const breadcrumbItems = useMemo(() => [...(node?.breadcrumb ?? [])], [node]);

  const handleTreeContextChange = useCallback(
    (context: Record<string, { isSelected?: boolean }>) => {
      setTreeContext(context as Parameters<typeof setTreeContext>[0]);

      const selectedEntry = Object.entries(context).find(
        ([, value]) => value?.isSelected,
      );
      const nextNodeId = selectedEntry?.[0];

      if (nextNodeId && nextNodeId !== selectedNodeId) {
        router.push(`/admin/edit/${nextNodeId}`);
      }
    },
    [router, selectedNodeId, setTreeContext],
  );

  const handleAdd = async () => {
    if (!node) return;
    const name = globalThis.prompt("Name for the new node:");
    if (!name?.trim()) return;

    const createdId = await addNode(
      node.id,
      name.trim(),
      node.type || "node",
      language,
    );

    if (createdId) {
      router.push(`/admin/edit/${createdId}`);
    } else {
      showToast({ title: "Failed to create node", type: "error" });
    }
  };

  const handleSave = async () => {
    const ok = await saveNode();
    showToast({
      title: ok ? "Node saved" : "Failed to save node",
      type: ok ? "success" : "error",
    });
  };

  const handleDelete = async () => {
    if (!node) return;
    if (!globalThis.confirm(`Delete node "${nodeTitle(node)}"?`)) return;
    const parentId = await deleteNode();
    if (parentId) {
      router.replace(`/admin/edit/${parentId}`);
    }
  };

  const nodeTitle = (n: { type: string; data?: unknown }) =>
    (n.data as { "0"?: { title?: string } } | null)?.["0"]?.title ?? n.type;

  if (!node) {
    return <div className="admin-page">Loading…</div>;
  }

  const title = nodeTitle(node);

  return (
    <div className="admin-edit">
      <div className="admin-edit__sidebar">
        <IxContentHeader headerTitle="Hierarchy" headerSubtitle={node.type} />
        <NodeTree
          model={tree.model}
          context={tree.context}
          onContextChange={handleTreeContextChange}
        />
      </div>

      <div className="admin-edit__main">
        <IxContentHeader headerTitle={title} headerSubtitle={`ID = ${node.id}`}>
          <IxIconButton
            icon={iconChevronLeft}
            title="Back"
            onClick={() => router.back()}
          />
          <IxSelect
            value={language}
            style={{ minWidth: "80px", width: "80px" }}
            onValueChange={(event) =>
              setLanguage(event.detail === "de" ? "de" : "en")
            }
          >
            <IxSelectItem value="en" label="EN" />
            <IxSelectItem value="de" label="DE" />
          </IxSelect>
          <IxIconButton
            icon={iconAdd}
            title="Add node"
            onClick={() => void handleAdd()}
          />
          <IxIconButton
            icon={iconSaveAll}
            title="Save"
            onClick={() => void handleSave()}
          />
          <IxIconButton
            icon={iconTrashcan}
            title="Delete node"
            onClick={() => void handleDelete()}
          />
        </IxContentHeader>

        <NodeBreadcrumb
          breadcrumb={breadcrumbItems}
          nodeChildren={node.children ?? []}
          currentId={node.id}
          onNavigate={(nextId) => router.push(`/admin/edit/${nextId}`)}
        />

        <DynamicForm fields={formFields} onFieldChange={setFormFields} />
        {loading && <p style={{ opacity: 0.7 }}>Loading updated node…</p>}
      </div>
    </div>
  );
}
