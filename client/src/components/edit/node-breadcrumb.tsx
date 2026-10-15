import { useEditStore } from "../../lib/edit.store";
import SdBreadcrumb from "../SdBreadcrumb";
import type { SdBreadcrumbItem } from "../../models/sd-breadcrumb";

export default function NodeBreadcrumb() {
  const node = useEditStore((s) => s.node);
  const fetchNode = useEditStore((s) => s.fetchNode);
  const selectedNodeId = useEditStore((s) => s.selectedNodeId);

  const lineage = [...(node?.breadcrumb ?? [])].reverse();

  const items: SdBreadcrumbItem[] =
    lineage.length === 0
      ? [{ id: "00000000-0000-4000-8000-000000000000", label: "Root" }]
      : lineage.map((item: any) => ({
          id: item.id,
          label: item.title || item.id,
        }));

  return (
    <SdBreadcrumb
      value={items}
      config={{
        onSelect: (item: SdBreadcrumbItem) => {
          if (item.id !== selectedNodeId) void fetchNode(item.id);
        },
      }}
    />
  );
}
