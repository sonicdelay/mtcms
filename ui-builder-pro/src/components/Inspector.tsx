
import React from 'react'
import { NodeData } from './types'
import { findNode, moveChild } from './utils'

export default function Inspector({ tree, selectedId, setSelectedId, setTree }: {
  tree: NodeData[]
  selectedId?: string
  setSelectedId: (id?: string)=>void
  setTree: (updater: (prev: NodeData[])=>NodeData[])=>void
}) {
  const renderNode = (n: NodeData, parent?: NodeData) => {
    const isSel = selectedId === n.id
    const idx = parent ? parent.children.findIndex(c => c.id === n.id) : -1
    return (
      <div key={n.id} style={{ marginLeft: 10, padding: 4, borderLeft: '1px dashed #ddd' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div onClick={()=>setSelectedId(n.id)} style={{ cursor:'pointer', fontWeight: isSel ? 700 : 400 }}>{n.type}</div>
          {parent && (
            <>
              <button className="btn" onClick={()=>setTree(prev=>moveChild(prev, parent.id, idx, -1))}>↑</button>
              <button className="btn" onClick={()=>setTree(prev=>moveChild(prev, parent.id, idx, 1))}>↓</button>
            </>
          )}
        </div>
        {n.children.map(ch => renderNode(ch, n))}
      </div>
    )
  }

  return (
    <div className="pane" style={{ padding: 10 }}>
      <h3>Inspector</h3>
      <div>
        {tree.map(n => renderNode(n))}
      </div>
    </div>
  )
}
