export interface Node {
  type: string;
  source?: string;
  children?: LayoutChild[] | string;
}

export interface PaneNode {
  type: "pane";
  title: string;
  className?: string;
  titleClassName?: string;
  source?: string;
  children?: LayoutChild[] | string;
}

export interface SplitNode {
  type: "split";
  className?: string;
  childClassName?: string;
  children: LayoutChild[] | string;
}

export interface TextNode {
  type: "text";
  content: string;
}

export type LayoutNode = PaneNode | SplitNode | TextNode;
export type LayoutChild = LayoutNode | string;
