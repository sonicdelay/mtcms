
import React from 'react'
import NodeRenderer from './NodeRenderer'
import { NodeData, RenderContext } from './types'

export default function Canvas({ tree, ctx }: { tree: NodeData[], ctx: RenderContext }) {
  return (
    <div className="pane" style={{ padding: 10 }}>
      <h3>Canvas</h3>
      <div className="canvas" onDragOver={e=>e.preventDefault()} onDrop={ctx.onDropToRoot} onClick={()=>ctx.select(undefined)}>
        {tree.map(n => <NodeRenderer key={n.id} node={n} ctx={ctx} />)}
      </div>
    </div>
  )
}
