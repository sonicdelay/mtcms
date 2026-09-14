
import { useMemo } from 'react'
import Palette from './components/Palette'
import Canvas from './components/Canvas'
import PropertiesPanel from './components/PropertiesPanel'
import Inspector from './components/Inspector'
import { NodeData, RenderContext } from './components/types'
import { createNode, deleteNode, duplicateNode, ensureDefaults, findNode, insertChild, updateNode } from './components/utils'
import { registry } from './components/Registry'
import { useHistory } from './components/History'
import { loadTree, saveTree } from './components/Storage'
import PluginManager from './components/PluginManager'

const initialTree: NodeData[] = loadTree() ?? [
  { id: crypto.randomUUID(), type:'row', props: { style: { display:'flex', gap: 12 } }, children: [
    { id: crypto.randomUUID(), type:'box', props: { style: { padding: 12, background:'#fff' } }, children: [
      { id: crypto.randomUUID(), type:'text', props: { text: 'Hello' }, children: [] }
    ] },
    { id: crypto.randomUUID(), type:'column', props: { style: { gap: 8 } }, children: [
      { id: crypto.randomUUID(), type:'button', props: { text:'Click' }, children: [] },
      { id: crypto.randomUUID(), type:'image', props: { src: 'https://picsum.photos/120/80' }, children: [] }
    ] }
  ] }
]

export default function App() {
  const { present: tree, commit: setTree, undo, redo, canUndo, canRedo } = useHistory<NodeData[]>(ensureDefaults(initialTree, (t)=>registry[t]?.defaultProps?.() ?? {}))
  const selectedId = useMemo(() => undefined as string | undefined, [])
  let _selectedId: string | undefined = undefined

  const select = (id?: string) => {
    _selectedId = id
    // no-op state, selection is transient per render via closure here; a small simplification
  }

  const ctx: RenderContext = {
    selectedId: _selectedId,
    select,
    requestDropFor: (parentId: string) => (e) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('component-type')
      const desc = registry[type]
      if (!desc) return
      const child: NodeData = { id: crypto.randomUUID(), type, props: desc.defaultProps?.() ?? {}, children: [] }
      setTree(insertChild(tree, parentId, child))
    },
    onDropToRoot: (e) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('component-type')
      const desc = registry[type]
      if (!desc) return
      const child: NodeData = { id: crypto.randomUUID(), type, props: desc.defaultProps?.() ?? {}, children: [] }
      setTree([...tree, child])
    },
    updateNode: (id, updater) => {
      setTree(updateNode(tree, id, updater))
      saveTree(tree)
    }
  }

  const selectedNode = useMemo(() => {
    if (!_selectedId) return undefined
    return findNode(tree, _selectedId).node
  }, [tree])

  const updateSelected = (updater: (draft: NodeData)=>void) => {
    if (!_selectedId) return
    setTree(updateNode(tree, _selectedId, updater))
  }

  // Toolbar actions
  const exportJSON = () => {
    const s = JSON.stringify(tree, null, 2)
    navigator.clipboard?.writeText(s)
    alert('JSON copied to clipboard. You can also open DevTools and inspect window.__tree')
    ;(window as any).__tree = tree
  }
  const importJSON = () => {
    const s = prompt('Paste JSON here:')
    if (!s) return
    try {
      const parsed = JSON.parse(s)
      setTree(parsed)
      saveTree(parsed)
    } catch (e) {
      alert('Invalid JSON')
    }
  }
  const removeSelected = () => {
    if (!_selectedId) return
    setTree(deleteNode(tree, _selectedId))
  }
  const duplicateSelected = () => {
    if (!_selectedId) return
    setTree(duplicateNode(tree, _selectedId))
  }
  const reset = () => {
    if (confirm('Reset canvas?')) setTree([])
  }

  return (
    <div className="app-shell">
      <div className="toolbar">
        <button className="btn" onClick={undo} disabled={!canUndo}>Undo</button>
        <button className="btn" onClick={redo} disabled={!canRedo}>Redo</button>
        <button className="btn" onClick={exportJSON}>Export JSON</button>
        <button className="btn" onClick={importJSON}>Import JSON</button>
        <button className="btn" onClick={duplicateSelected} disabled={!_selectedId}>Duplicate</button>
        <button className="btn" onClick={removeSelected} disabled={!_selectedId}>Delete</button>
        <button className="btn" onClick={reset}>Reset</button>
        <div style={{ flex: 1 }} />
        <PluginManager />
      </div>
      <div className="layout">
        <Palette />
        <Canvas tree={tree} ctx={ctx} />
        <div className="pane right" style={{ display:'grid', gridTemplateRows:'1fr 1fr' }}>
          <Inspector tree={tree} selectedId={_selectedId} setSelectedId={select} setTree={(upd)=>setTree(upd(tree))} />
          <PropertiesPanel node={selectedNode} update={updateSelected} />
        </div>
      </div>
    </div>
  )
}
