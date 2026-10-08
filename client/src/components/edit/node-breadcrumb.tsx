import { useEditStore } from "../../lib/edit.store";
import SdBreadcrumb from "../SdBreadcrumb";

export default function NodeBreadcrumb() {
  const node = useEditStore((s) => s.node);
  const fetchNode = useEditStore((s) => s.fetchNode);
  const selectedNodeId = useEditStore((s) => s.selectedNodeId);

  const children = node?.children ?? [];
  const lineage = [...(node?.breadcrumb ?? [])].reverse();

  const current = (lineage.length === 0
    ? [{ id: "00000000-0000-4000-8000-000000000000", label: "Root" }]
    : lineage.map((item) => ({
      id: item.id,
      label: item.title || item.id,
    })));

  return (
    <SdBreadcrumb
      value={{
        current,
        next: children.map((child) => ({
          id: child.id,
          label: child.title || child.id,
        })),
      }}
      onSelect={(id) => {
        if (id !== selectedNodeId) void fetchNode(id);
      }}
    />
  );
}
