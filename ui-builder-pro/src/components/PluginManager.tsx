import React from "react";
import { register } from "./Registry";

export default function PluginManager() {
  const addSample = () => {
    register({
      type: "badge",
      title: "Badge",
      defaultProps: () => ({
        text: "New",
        style: {
          background: "#ffeb3b",
          color: "#111",
          padding: "2px 6px",
          borderRadius: 6,
          display: "inline-block",
        },
      }),
      droppable: false,
      render: (node) => <span style={node.props.style}>{node.props.text}</span>,
      Settings: ({ node, update }) => (
        <div style={{ display: "grid", gap: 6 }}>
          <label>
            Text{" "}
            <input
              value={node.props.text}
              onChange={(e) => update({ text: e.target.value })}
            />
          </label>
          <label>
            Background{" "}
            <input
              value={node.props.style?.background ?? ""}
              onChange={(e) =>
                update({
                  style: { ...node.props.style, background: e.target.value },
                })}
            />
          </label>
          <label>
            Color{" "}
            <input
              value={node.props.style?.color ?? ""}
              onChange={(e) =>
                update({
                  style: { ...node.props.style, color: e.target.value },
                })}
            />
          </label>
        </div>
      ),
    });
    alert('Plugin "badge" registered. It now appears in the palette.');
  };
  return <button className="btn" onClick={addSample}>Add Sample Plugin</button>;
}
