
import React from 'react'
import { registry } from './Registry'

export default function Palette() {
  const items = Object.values(registry)
  return (
    <div className="pane" style={{ padding: 10 }}>
      <h3>Palette</h3>
      {items.map(it => (
        <div key={it.type}
             className="palette-item"
             draggable
             onDragStart={e => e.dataTransfer.setData('component-type', it.type)}>
          {it.title}
        </div>
      ))}
    </div>
  )
}
