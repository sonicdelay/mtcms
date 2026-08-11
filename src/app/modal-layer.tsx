"use client";

import { createElement, type ComponentType, type ReactNode } from "react";
import { useAppStore } from "@/lib/app.store";

type ModalSlot = ReactNode | ComponentType;

type ModalLayerProps = {
  open?: boolean;
  content?: ModalSlot | null;
  children?: ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
};

const renderSlot = (slot: ModalSlot | null | undefined): ReactNode => {
  if (!slot) return null;
  if (typeof slot === "function") {
    return createElement(slot as ComponentType);
  }
  return slot;
};

export function ModalLayer({
  open,
  content,
  children,
  onClose,
  dismissible = true,
}: ModalLayerProps) {
  const storeIsOpen = useAppStore((state) => state.isModalOpen);
  const storeContent = useAppStore((state) => state.modalContent);
  const closeModal = useAppStore((state) => state.closeModal);

  const isOpen = open ?? storeIsOpen;
  const resolvedContent = children ?? renderSlot(content ?? storeContent);

  if (!isOpen || !resolvedContent) {
    return null;
  }

  const handleClose = () => {
    if (!dismissible) return;
    if (onClose) {
      onClose();
      return;
    }
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={handleClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-xl bg-background p-6 text-foreground shadow-2xl"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        {resolvedContent}
      </div>
    </div>
  );
}
