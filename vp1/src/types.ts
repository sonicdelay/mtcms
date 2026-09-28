export interface SdProps {
  type?: string;
  className?: string;
  eventIn?: (payload?: unknown) => void;
  eventOut?: (payload?: unknown) => void;
  style?: React.CSSProperties;
}

export interface Node {
  id?: string;
  type: string;
  source?: string;
  children?: LayoutChild[] | string;
  className?: string;
  [key: string]: unknown
}


export type LayoutChild = Node | string;
