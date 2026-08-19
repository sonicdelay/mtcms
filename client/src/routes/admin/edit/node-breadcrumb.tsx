import { useNavigate } from "react-router";
import { IxButton } from "@siemens/ix-react";
import { iconArrowLeft } from "@siemens/ix-icons/icons";
import { useEditStore } from "../../../lib/edit.store";

export default function NodeBreadcrumb() {
  const navigate = useNavigate();
  const node = useEditStore((s) => s.node);
  const fetchNode = useEditStore((s) => s.fetchNode);
  const selectedNodeId = useEditStore((s) => s.selectedNodeId);

  const lineage = [...(node?.breadcrumb ?? [])].reverse();

  return (
    <div className="admin-node-breadcrumb">
      <IxButton
        variant="secondary"
        icon={iconArrowLeft}
        onClick={() => navigate(-1)}
      />
      <div className="admin-node-breadcrumb__items">
        {lineage.length === 0 && <span>Root</span>}
        {lineage.map((item, index) => (
          <span key={item.id} className="admin-node-breadcrumb__item">
            <button
              type="button"
              onClick={() => {
                if (item.id !== selectedNodeId) {
                  void fetchNode(item.id);
                }
              }}
            >
              {item.title || item.id}
            </button>
            {index < lineage.length - 1 && (
              <span className="admin-node-breadcrumb__separator">/</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}