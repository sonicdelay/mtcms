import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { TreeContext, TreeModel } from "@siemens/ix";
import type { EditorNode } from "./admin.api";
import {
  createNode,
  deleteNode,
  getNodeEditor,
  updateNode,
} from "./admin.api";
import { useAppStore } from "./app.store";

const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

export interface FormField {
  name: string;
  value: string;
  type: string;
  data?: Array<{ value: string; label: string }>;
}

interface TreeData {
  name: string;
}

type LineageItem = { id: string; label: string };

type TreeState = {
  model: TreeModel<TreeData>;
  context: TreeContext;
};

type Language = "en" | "de";

const EMPTY_TREE_MODEL: TreeModel<TreeData> = {
  [ZERO_UUID]: {
    id: ZERO_UUID,
    data: { name: "Root" },
    hasChildren: true,
    children: [],
  },
};

const EMPTY_TREE_STATE: TreeState = {
  model: EMPTY_TREE_MODEL,
  context: {},
};

const mergeIds = (left: string[], right: string[]) => [
  ...new Set([...left, ...right]),
];

const getLineage = (node: EditorNode): LineageItem[] =>
  [...(node.breadcrumb ?? [])].reverse().map((item) => ({
    id: item.id,
    label: item.title || item.id,
  }));

const displayName = (label: string, id: string): string =>
  label === id ? label : `${label} (${id})`;

const buildTreeState = (
  node: EditorNode,
  previousTree: TreeState,
): TreeState => {
  const lineage = getLineage(node);
  const nodeChildren = node.children ?? [];

  const treeModel: TreeModel<TreeData> = { ...previousTree.model };
  const treeContext: TreeContext = { ...previousTree.context };

  Object.entries(treeContext).forEach(([key, value]) => {
    treeContext[key] = { ...value, isSelected: false };
  });

  if (lineage.length > 0) {
    const firstId = lineage[0].id;
    const rootNode = treeModel[ZERO_UUID];
    const rootChildren = mergeIds(rootNode?.children ?? [], [firstId]);

    treeModel[ZERO_UUID] = {
      id: ZERO_UUID,
      data: { name: rootNode?.data?.name ?? "Root" },
      hasChildren: rootChildren.length > 0,
      children: rootChildren,
    };

    treeContext[ZERO_UUID] = {
      ...treeContext[ZERO_UUID],
      isExpanded: true,
      isSelected: false,
    };
  }

  lineage.forEach((item, index) => {
    const nextInPath = lineage[index + 1];
    const fetchedChildren = nextInPath
      ? [nextInPath.id]
      : nodeChildren.map((child) => child.id);
    const currentItem = treeModel[item.id];
    const children = mergeIds(currentItem?.children ?? [], fetchedChildren);

    treeModel[item.id] = {
      id: item.id,
      data: { name: displayName(item.label, item.id) },
      hasChildren: (currentItem?.hasChildren ?? false) || children.length > 0,
      children,
    };

    treeContext[item.id] = {
      ...treeContext[item.id],
      isExpanded: true,
      isSelected: item.id === node.id,
    };
  });

  nodeChildren.forEach((child) => {
    const existingChild = treeModel[child.id];
    treeModel[child.id] = {
      id: child.id,
      data: { name: displayName(child.title || child.id, child.id) },
      hasChildren: existingChild?.hasChildren ?? false,
      children: existingChild?.children ?? [],
    };
    treeContext[child.id] = {
      ...treeContext[child.id],
      isSelected: false,
    };
  });

  return { model: treeModel, context: treeContext };
};

const buildFormModel = (node: EditorNode, language: Language): FormField[] => {
  const zero = node.data?.["0"] as
    | { values?: Record<string, Record<string, unknown>> }
    | undefined;
  const values = zero?.values?.[language] ?? zero?.values?.en ?? {};
  const entries = Object.entries(values);

  if (entries.length > 0) {
    return entries.map(([key, value]) => ({
      name: key,
      type: "textarea",
      value: JSON.stringify(value, null, 2),
    }));
  }

  return [
    {
      name: "nodeData",
      type: "textarea",
      value: JSON.stringify(node.data ?? {}, null, 2),
    },
  ];
};

interface EditStore {
  selectedNodeId: string | null;
  node: EditorNode | null;
  loading: boolean;
  language: Language;
  tree: TreeState;
  formFields: FormField[];
  setTreeContext: (context: TreeContext) => void;
  setLanguage: (language: Language) => void;
  setFormFields: (fields: FormField[]) => void;
  fetchNode: (nodeId: string, force?: boolean) => Promise<EditorNode | null>;
  addNode: (
    parentId: string,
    name: string,
    type: string,
    language: Language,
  ) => Promise<string | null>;
  saveNode: () => Promise<boolean>;
  deleteNode: () => Promise<string | null>;
}

export const useEditStore = create<EditStore>()(
  devtools(
    persist(
      (set, get) => ({
        selectedNodeId: null,
        node: null,
        loading: false,
        language: "en",
        tree: EMPTY_TREE_STATE,
        formFields: [],
        setTreeContext: (context) =>
          set(
            (state) => ({ tree: { ...state.tree, context } }),
            false,
            "edit/setTreeContext",
          ),
        setLanguage: (language) => {
          const node = get().node;
          set(
            {
              language,
              formFields: node ? buildFormModel(node, language) : [],
            },
            false,
            "edit/setLanguage",
          );
        },
        setFormFields: (fields) =>
          set({ formFields: fields }, false, "edit/setFormFields"),
        fetchNode: async (nodeId, force = false) => {
          const currentNode = get().node;
          if (!force && currentNode?.id === nodeId) {
            set({ selectedNodeId: nodeId }, false, "edit/fetchNode:reuse");
            return currentNode;
          }

          set(
            { loading: true, selectedNodeId: nodeId },
            false,
            "edit/fetchNode:start",
          );

          const token = useAppStore.getState().token;
          if (!token) {
            set({ loading: false }, false, "edit/fetchNode:noToken");
            return null;
          }

          try {
            const data = await getNodeEditor(token, nodeId);
            const tree = buildTreeState(data, get().tree);
            set(
              {
                selectedNodeId: data.id ?? nodeId,
                node: data,
                loading: false,
                tree,
                formFields: buildFormModel(data, get().language),
              },
              false,
              "edit/fetchNode:success",
            );
            return data;
          } catch {
            set({ loading: false }, false, "edit/fetchNode:error");
            return null;
          }
        },
        addNode: async (parentId, name, type, language) => {
          const token = useAppStore.getState().token;
          if (!token) {
            return null;
          }

          try {
            const created = await createNode(token, {
              type,
              data: {
                "0": {
                  title: name,
                  icon: "node",
                  meta: {},
                  parent: parentId,
                  values: { en: {}, [language]: {} },
                  position: 10,
                  protected: false,
                  reviewGroup: "0",
                },
              },
            });
            return created.id;
          } catch {
            return null;
          }
        },
        saveNode: async () => {
          const { node, formFields, language } = get();
          if (!node?.id) {
            return false;
          }

          const token = useAppStore.getState().token;
          if (!token) {
            return false;
          }

          let nextData: Record<string, unknown>;
          const isWholeData =
            formFields.length === 1 && formFields[0].name === "nodeData";

          if (isWholeData) {
            try {
              nextData = JSON.parse(formFields[0].value) as Record<
                string,
                unknown
              >;
            } catch {
              nextData = node.data ?? {};
            }
          } else {
            const currentRoot =
              (node.data?.["0"] as Record<string, unknown>) ?? {};
            const currentValues =
              (currentRoot.values as Record<string, Record<string, unknown>>) ??
              {};
            const valuesFromForm = formFields.reduce<Record<string, unknown>>(
              (acc, field) => {
                try {
                  acc[field.name] = JSON.parse(field.value);
                } catch {
                  acc[field.name] = field.value;
                }
                return acc;
              },
              {},
            );

            nextData = {
              ...node.data,
              "0": {
                ...currentRoot,
                values: {
                  ...currentValues,
                  [language]: valuesFromForm,
                },
              },
            };
          }

          try {
            await updateNode(token, node.id, { data: nextData });
            await get().fetchNode(node.id);
            return true;
          } catch {
            return false;
          }
        },
        deleteNode: async () => {
          const { node } = get();
          if (!node?.id || node.id === ZERO_UUID) {
            return null;
          }

          const token = useAppStore.getState().token;
          if (!token) {
            return null;
          }

          const parentId =
            (node.data?.["0"] as { parent?: string } | undefined)?.parent ??
            ZERO_UUID;

          try {
            await deleteNode(token, node.id);
            return parentId;
          } catch {
            return null;
          }
        },
      }),
      {
        name: "edit-store-persist",
        partialize: (state) => ({ language: state.language }),
      },
    ),
    { name: "edit-store" },
  ),
);