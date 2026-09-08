export interface Node {
  type: string;
  source?: string;
  children?: LayoutChild[] | string;
  className?: string;
  [key: string]: unknown
}


export type LayoutChild = Node | string;
