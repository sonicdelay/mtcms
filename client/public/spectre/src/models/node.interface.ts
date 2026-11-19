import { MiniNode } from './mini-node.interface.ts';

export interface Node {
  id: string;
  type: 'file' | 'directory';  
  update: Date;
  sync: json;
  data: json; // Only for files
  children?: Node[]; // Only for directories
  breadcrumb?: MiniNode[];
}
