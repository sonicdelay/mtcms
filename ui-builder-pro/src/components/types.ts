
export interface NodeData {
  id: string;
  type: string;
  props: any;
  children: NodeData[];
}

export interface RenderContext {
  selectedId?: string;
  select: (id?: string) => void;
  requestDropFor: (parentId: string) => (e: React.DragEvent) => void;
  onDropToRoot: (e: React.DragEvent) => void;
  updateNode: (id: string, updater: (draft: NodeData) => void) => void;
}

export interface SettingsProps {
  node: NodeData;
  update: (patch: Partial<NodeData['props']>) => void;
}
