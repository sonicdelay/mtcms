import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  title: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  pushToast: (title: string, type: ToastType) => void;
  dismissToast: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  pushToast: (title, type) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, title, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (title: string, type: ToastType): void => {
  useToastStore.getState().pushToast(title, type);
};
