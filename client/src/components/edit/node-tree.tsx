import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useEditStore, type EditTreeModel } from "../../lib/edit.store";
import SdTree, { type TreeItem } from "../SdTree";

const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

const toItems = (
  model: EditTreeModel,
  rootId: string,
  seen: Set<string> = new Set(),
): TreeItem[] => {
  const node = model[rootId];
  if (!node || seen.has(rootId)) return [];
  seen.add(rootId);
  return node.children.map((childId) => {
    const child = model[childId];
    return {
      id: childId,
      title: child?.data.name ?? childId,
      children: toItems(model, childId, seen),
    };
  });
};

export default function NodeTree() {
  const navigate = useNavigate();
  const tree = useEditStore((s) => s.tree);
  const selectedNodeId = useEditStore((s) => s.selectedNodeId);
  const fetchNode = useEditStore((s) => s.fetchNode);

  const items = useMemo(() => toItems(tree.model, ZERO_UUID), [tree.model]);

  return (
    <SdTree
      value={items}
      selectedId={selectedNodeId ?? undefined}
      defaultExpandedIds={[ZERO_UUID]}
      onSelect={(item) => {
        const id = String(item.id);
        if (id && id !== selectedNodeId) {
          navigate(`/admin/edit/${encodeURIComponent(id)}`);
          void fetchNode(id);
        }
      }}
    />
  );
}
