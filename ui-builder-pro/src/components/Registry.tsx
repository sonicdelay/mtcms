
import React from 'react'
import type { NodeData, RenderContext, SettingsProps } from './types'

export interface ComponentDescriptor {
  type: string
  title: string
  icon?: string
  defaultProps: () => any
  render: (node: NodeData, children: React.ReactNode, ctx: RenderContext) => React.ReactNode
  Settings?: React.FC<SettingsProps>
  droppable?: boolean
  resizable?: boolean
  draggable?: boolean
}

export type Registry = Record<string, ComponentDescriptor>

export const registry: Registry = {}

export function register(desc: ComponentDescriptor) {
  registry[desc.type] = desc
}

// Built-in components
register({
  type: 'text',
  title: 'Text',
  defaultProps: () => ({ text: 'Text', style: { color: '#111', fontSize: 16 } }),
  droppable: false,
  render: (node) => <span style={node.props.style}>{node.props.text}</span>,
})

register({
  type: 'button',
  title: 'Button',
  defaultProps: () => ({ text: 'Click me', style: { padding: '8px 12px' } }),
  droppable: false,
  render: (node) => <button style={node.props.style}>{node.props.text}</button>,
})

register({
  type: 'image',
  title: 'Image',
  defaultProps: () => ({ src: 'https://picsum.photos/200/120', alt: 'image', style: { display: 'block', maxWidth: '100%' } }),
  droppable: false,
  render: (node) => <img src={node.props.src} alt={node.props.alt} style={node.props.style} />,
  Settings: ({ node, update }) => (
    <div style={{ display:'grid', gap:6 }}>
      <label>Src <input value={node.props.src} onChange={e=>update({ src: e.target.value })} style={{width:'100%'}}/></label>
      <label>Alt <input value={node.props.alt} onChange={e=>update({ alt: e.target.value })} style={{width:'100%'}}/></label>
    </div>
  )
})

register({
  type: 'box',
  title: 'Box',
  defaultProps: () => ({ style: { border: '1px solid #ccc', padding: 10, background: '#fff' } }),
  droppable: true,
  resizable: true,
  draggable: true,
  render: (node, children) => <div style={node.props.style}>{children}</div>,
})

register({
  type: 'row',
  title: 'Row',
  defaultProps: () => ({ style: { display: 'flex', gap: 8, alignItems: 'stretch' } }),
  droppable: true,
  render: (node, children) => <div style={node.props.style}>{children}</div>,
})

register({
  type: 'column',
  title: 'Column',
  defaultProps: () => ({ style: { display: 'flex', flexDirection: 'column', gap: 8 } }),
  droppable: true,
  render: (node, children) => <div style={node.props.style}>{children}</div>,
})
