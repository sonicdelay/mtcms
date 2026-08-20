import { useEffect, useState } from "react";
import { IxBreadcrumb, IxBreadcrumbItem } from "@siemens/ix-react";
import { useEditStore } from "../../lib/edit.store";

export default function NodeBreadcrumb() {
  const node = useEditStore((s) => s.node);
  const fetchNode = useEditStore((s) => s.fetchNode);
  const selectedNodeId = useEditStore((s) => s.selectedNodeId);

  const [nextItems, setNextItems] = useState<string[]>([]);

  const children = node?.children ?? [];

  useEffect(() => {
    setNextItems(children.map((child) => child.title || child.id));
  }, [children, setNextItems]);

  const lineage = [...(node?.breadcrumb ?? [])].reverse();

  const handleItemClick = (label: string) => {
    const item = lineage.find((i) => (i.title || i.id) === label);
    if (item && item.id !== selectedNodeId) {
      void fetchNode(item.id);
    }
  };

  const handleNextClick = (label: string) => {
    const child = children.find((c) => (c.title || c.id) === label);
    if (child && child.id !== selectedNodeId) {
      void fetchNode(child.id);
    }
  };

  return (
    <IxBreadcrumb
      nextItems={nextItems}
      onItemClick={(event) => handleItemClick(event.detail)}
      onNextClick={(event) => handleNextClick(event.detail.item)}
    >
      {lineage.length === 0 && <IxBreadcrumbItem label="Root" />}
      {lineage.map((item) => (
        <IxBreadcrumbItem
          key={item.id}
          label={item.title || item.id}
        />
      ))}
    </IxBreadcrumb>
  );
}
