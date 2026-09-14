
import React from 'react'
import { NodeData } from './types'
import { registry } from './Registry'

export default function PropertiesPanel({ node, update }: { node?: NodeData, update: (updater: (draft: NodeData)=>void)=>void }) {
  if (!node) return <div className="pane right" style={{ padding: 10 }}><h3>Properties</h3><div>Select an element</div></div>
  const desc = registry[node.type]

  const updateProps = (patch: any) => update(n => { n.props = { ...n.props, ...patch } })
  const s = node.props.style || {}

  return (
    <div className="pane right" style={{ padding: 10 }}>
      <h3>Properties</h3>
      <div style={{ display:'grid', gap:8 }}>
        <div><b>Type:</b> {node.type}</div>
        {node.type === 'text' && (
          <label>Text<input value={node.props.text ?? ''} onChange={e=>updateProps({ text: e.target.value })} style={{ width:'100%' }}/></label>
        )}
        {node.type === 'button' && (
          <label>Label<input value={node.props.text ?? ''} onChange={e=>updateProps({ text: e.target.value })} style={{ width:'100%' }}/></label>
        )}
        <fieldset style={{ border:'1px solid #eee' }}>
          <legend>Style</legend>
          <label>Position
            <select value={s.position ?? 'static'} onChange={e=>updateProps({ style: { ...s, position: e.target.value } })}>
              <option>static</option>
              <option>absolute</option>
            </select>
          </label>
          {['left','top','width','height','padding','margin'].map(k => (
            <label key={k}>{k}
              <input value={(s as any)[k] ?? ''} onChange={e=>updateProps({ style: { ...s, [k]: parseInputNumberOrString(e.target.value) } })} />
            </label>
          ))}
          <label>Background<input value={s.background ?? ''} onChange={e=>updateProps({ style: { ...s, background: e.target.value } })} /></label>
          <label>Color<input value={s.color ?? ''} onChange={e=>updateProps({ style: { ...s, color: e.target.value } })} /></label>
        </fieldset>

        {desc?.Settings && (
          <div>
            <h4>{desc.title} Settings</h4>
            <desc.Settings node={node} update={(p)=>updateProps(p)} />
          </div>
        )}
      </div>
    </div>
  )
}

function parseInputNumberOrString(v: string): any {
  if (v.trim() === '') return ''
  const n = Number(v)
  return Number.isFinite(n) ? n : v
}
