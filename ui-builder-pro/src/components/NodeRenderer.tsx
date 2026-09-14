
import React, { useRef, useState } from 'react'
import { registry } from './Registry'
import { NodeData, RenderContext } from './types'

interface Props {
  node: NodeData
  ctx: RenderContext
}

export default function NodeRenderer({ node, ctx }: Props) {
  const desc = registry[node.type]
  const isSelected = ctx.selectedId === node.id
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const draggable = !!desc?.draggable && node.props.style?.position === 'absolute'
  const resizable = !!desc?.resizable

  const onMouseDownDrag = (e: React.MouseEvent) => {
    if (!draggable) return
    e.stopPropagation()
    setDragging(true)
    const startX = e.clientX, startY = e.clientY
    const startLeft = parseInt(node.props.style?.left ?? 0)
    const startTop = parseInt(node.props.style?.top ?? 0)
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      ctx.updateNode(node.id, n => {
        n.props.style = { ...n.props.style, left: startLeft + dx, top: startTop + dy, position: 'absolute' }
      })
    }
    const onUp = () => { setDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const onMouseDownResize = (e: React.MouseEvent) => {
    if (!resizable) return
    e.stopPropagation()
    setResizing(true)
    const startX = e.clientX, startY = e.clientY
    const startW = parseInt(node.props.style?.width ?? 150)
    const startH = parseInt(node.props.style?.height ?? 100)
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      ctx.updateNode(node.id, n => {
        n.props.style = { ...n.props.style, width: Math.max(20, startW + dx), height: Math.max(20, startH + dy) }
      })
    }
    const onUp = () => { setResizing(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const children = node.children.map(ch => (
    <NodeRenderer key={ch.id} node={ch} ctx={ctx} />
  ))

  const wrapperStyle: React.CSSProperties = isSelected ? { outline: '2px solid #4a90e2', outlineOffset: 2 } : {}

  const content = (
    <div
      ref={ref}
      className={isSelected ? 'selected-outline' : undefined}
      onClick={(e)=>{ e.stopPropagation(); ctx.select(node.id) }}
      onDragOver={e=>{ if (desc?.droppable) { e.preventDefault(); } }}
      onDrop={desc?.droppable ? ctx.requestDropFor(node.id) : undefined}
      style={{ position: 'relative', ...wrapperStyle }}
    >
      {desc?.render ? desc.render(node, children, ctx) : <div>Unknown: {node.type}</div>}
      {isSelected && draggable && (
        <div onMouseDown={onMouseDownDrag} style={{ position:'absolute', top: -18, left: 0, fontSize: 12, color:'#4a90e2', cursor:'move', userSelect:'none' }}>Drag</div>
      )}
      {isSelected && resizable && (
        <div className="resize-handle" onMouseDown={onMouseDownResize} />
      )}
    </div>
  )

  return content
}
