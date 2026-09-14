
import { NodeData } from './types'

const KEY = 'ui_builder_pro_tree_v1'

export function saveTree(tree: NodeData[]) {
  localStorage.setItem(KEY, JSON.stringify(tree))
}

export function loadTree(): NodeData[] | null {
  const v = localStorage.getItem(KEY)
  if (!v) return null
  try { return JSON.parse(v) } catch { return null }
}
