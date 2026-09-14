
import { NodeData } from './types'

export function createNode(type: string, partial?: Partial<NodeData>): NodeData {
  return {
    id: crypto.randomUUID(),
    type,
    props: {},
    children: [],
    ...partial,
  }
}

export function findNode(root: NodeData[], id: string): { node?: NodeData, parent?: NodeData } {
  for (const n of root) {
    if (n.id === id) return { node: n };
    const res = findNode(n.children, id)
    if (res.node) return { node: res.node, parent: res.parent ?? n }
  }
  return {}
}

export function updateNode(root: NodeData[], id: string, updater: (n: NodeData)=>void): NodeData[] {
  return root.map(n => {
    if (n.id === id) {
      const copy: NodeData = { ...n, props: { ...n.props }, children: n.children.map(c=>c) }
      updater(copy)
      return copy
    }
    return { ...n, children: updateNode(n.children, id, updater) }
  })
}

export function insertChild(root: NodeData[], parentId: string, child: NodeData): NodeData[] {
  return root.map(n => {
    if (n.id === parentId) {
      return { ...n, children: [...n.children, child] }
    }
    return { ...n, children: insertChild(n.children, parentId, child) }
  })
}

export function deleteNode(root: NodeData[], id: string): NodeData[] {
  const recur = (arr: NodeData[]): NodeData[] => arr.filter(n => n.id !== id).map(n => ({ ...n, children: recur(n.children) }))
  return recur(root)
}

export function duplicateNode(root: NodeData[], id: string): NodeData[] {
  const cloneDeep = (n: NodeData): NodeData => ({ id: crypto.randomUUID(), type: n.type, props: { ...n.props }, children: n.children.map(cloneDeep) })
  const res = findNode(root, id)
  if (!res.node || !res.parent) return root
  const idx = res.parent.children.findIndex(c => c.id === id)
  const dup = cloneDeep(res.node)
  const parent = res.parent
  const newChildren = parent.children.slice()
  newChildren.splice(idx+1, 0, dup)
  return updateNode(root, parent.id, p => { p.children = newChildren })
}

export function moveChild(root: NodeData[], parentId: string, index: number, dir: -1|1): NodeData[] {
  const { node: parent } = findNode(root, parentId)
  if (!parent) return root
  const newIdx = index + dir
  if (newIdx < 0 || newIdx >= parent.children.length) return root
  const arr = parent.children.slice()
  const [item] = arr.splice(index,1)
  arr.splice(newIdx,0,item)
  return updateNode(root, parentId, p => { p.children = arr })
}

export function mapTree(root: NodeData[], f: (n: NodeData)=>NodeData): NodeData[] {
  return root.map(n => f({ ...n, children: mapTree(n.children, f) }))
}

export function ensureDefaults(root: NodeData[], getDefaults: (type:string)=>any): NodeData[] {
  return mapTree(root, n => ({ ...n, props: { ...getDefaults(n.type), ...n.props } }))
}
