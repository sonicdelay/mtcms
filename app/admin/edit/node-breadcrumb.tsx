"use client";

import { IxBreadcrumb, IxBreadcrumbItem } from "@siemens/ix-react";
import type { MiniNode } from "@/lib/types";

interface NodeBreadcrumbProps {
  breadcrumb: MiniNode[];
  nodeChildren: MiniNode[];
  currentId: string;
  onNavigate: (id: string) => void;
}

export default function NodeBreadcrumb({
  breadcrumb,
  nodeChildren,
  currentId,
  onNavigate,
}: NodeBreadcrumbProps) {
  const items = [...(breadcrumb ?? [])].reverse();
  const nextItems = (nodeChildren ?? []).map((child) => child.title);

  const handleNextClick = (label: string) => {
    const child = (nodeChildren ?? []).find((item) => item.title === label);
    if (child) {
      onNavigate(child.id);
    }
  };

  return (
    <IxBreadcrumb
      nextItems={nextItems as string[]}
      onNextClick={(event) => handleNextClick(String(event.detail.item))}
    >
      {items.length > 0 ? (
        items.map((item) => (
          <IxBreadcrumbItem
            key={item.id}
            title={`ID = ${item.id}`}
            onClick={() => onNavigate(item.id)}
            style={{
              cursor: "pointer",
              fontWeight: item.id === currentId ? 700 : 400,
            }}
          >
            {item.title || item.id}
          </IxBreadcrumbItem>
        ))
      ) : (
        <IxBreadcrumbItem>No breadcrumb</IxBreadcrumbItem>
      )}
    </IxBreadcrumb>
  );
}
