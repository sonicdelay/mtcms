import type { ReactNode } from "react";
import { createPortal } from "react-dom";

const PORTAL_ROOT_ID = "portal-root";

const getPortalRoot = (): HTMLElement => {
  const existing = document.getElementById(PORTAL_ROOT_ID);
  if (existing) {
    return existing;
  }
  const root = document.createElement("div");
  root.id = PORTAL_ROOT_ID;
  document.body.appendChild(root);
  return root;
};

export default function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, getPortalRoot());
}
