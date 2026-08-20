import { useNavigate } from "react-router";
import { IxTree } from "@siemens/ix-react";
import { useEditStore } from "../../lib/edit.store";

const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

export default function NodeTree() {
  const navigate = useNavigate();
  const tree = useEditStore((s) => s.tree);
  const setTreeContext = useEditStore((s) => s.setTreeContext);
  const fetchNode = useEditStore((s) => s.fetchNode);

  return (
    <IxTree
      root={ZERO_UUID}
      model={tree.model}
      context={tree.context}
      onContextChange={(event) => setTreeContext(event.detail)}
      onNodeClicked={(event) => {
        const id = event.detail;
        if (!id) return;
        navigate(`/admin/edit/${encodeURIComponent(id)}`);
        void fetchNode(id);
      }}
    />
  );
}
