import { useEffect } from "react";
import { type ComponentType, createElement, type ReactNode } from "react";
import { useAppStore } from "../lib/app.store";

export default function ModalHost() {
  const isOpen = useAppStore((s) => s.isModalOpen);
  const content = useAppStore((s) => s.modalContent);
  const modalSize = useAppStore((s) => s.modalSize);
  const closeModal = useAppStore((s) => s.closeModal);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeModal]);

  if (!isOpen || content === null) {
    return null;
  }

  const node = typeof content === "function"
    ? createElement(content as ComponentType)
    : (content as ReactNode);

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeModal}
        aria-hidden
      />
      <div
        className={`relative w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 ${
          modalSize === "wide"
            ? "flex h-[92vh] max-h-[92vh] max-w-[95vw] flex-col"
            : "max-w-md"
        }`}
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Close dialog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {node}
      </div>
    </div>
  );
}
