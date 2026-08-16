import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { TreeContext, TreeModel } from "@siemens/ix";
import type { EditorNode } from "@/lib/admin.api";

interface TreeData {
  name: string;
}
type TreeState = { model: TreeModel<TreeData>; context: TreeContext };

interface EditStore {
  node: EditorNode | null;
  tree: TreeState;
  setTreeContext: (context: TreeContext) => void;
  fetchNode: (id: string) => Promise<EditorNode | null>;
}

export const useBar = create<EditStore>()(
  devtools(
    (set, get) => ({
      node: null,
      tree: { model: {}, context: {} },
      setTreeContext: (context) =>
        set(
          (state) => ({ tree: { ...state.tree, context } }),
          false,
          "edit/setTreeContext",
        ),
      fetchNode: async (nodeId) => {
        const currentNode = get().node;
        if (currentNode?.id === nodeId) {
          set({ node: currentNode }, false, "reuse");
          return currentNode;
        }
        return null;
      },
    }),
    { name: "edit-store" },
  ),
);
