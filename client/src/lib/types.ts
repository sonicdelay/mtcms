export interface NodeValuesEntry {
  email?: string;
  password?: string;
  role?: string;
  [key: string]: unknown;
}

export interface NodeDataItem {
  icon?: string;
  meta?: Record<string, unknown>;
  title?: string;
  parent?: string;
  values?: Record<string, NodeValuesEntry>;
  position?: number;
  protected?: boolean;
  reviewGroup?: string;
  [key: string]: unknown;
}

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

export interface Article {
  slug: string;
  title: string;
}