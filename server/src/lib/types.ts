export interface Node {
  id: string;
  type: string;
  update: string;
  sync: Record<string, unknown> | null;
  data: Record<string, unknown> | null;
}

export interface MiniNode {
  id: string;
  title: string;
}

export interface FileItem {
  name: string;
  path: string;
  type: "dir" | "file";
}
