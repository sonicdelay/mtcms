import { useState, useEffect } from "react";
import { layouts, loadLayouts } from "./layoutTree";
import type { LayoutNode } from "./layoutTypes";
import renderNode from "./renderNode";
import { useWaveStore } from "./store";
import Editor from "./components/Editor";
import Config from "./components/Config";
import "./stylesheets/app.scss";

export default function App() {
  const [selectedLayout, setSelectedLayout] = useState<string>("");
  const [tree, setTree] = useState<LayoutNode | null>(null);
  const { start, stop, edit, toggleEdit } = useWaveStore();

  useEffect(() => {
    loadLayouts().then(() => {
      const names = Object.keys(layouts);
      if (names.length > 0) {
        setSelectedLayout(names[0]);
        setTree(layouts[names[0]]);
      }
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F8") {
        event.preventDefault();
        toggleEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleEdit]);

  useEffect(() => {
    const id = start();
    return () => stop(id);
  }, [start, stop]);

  return (
    <div className="flex w-full h-full min-h-0 flex-row">
      {edit && (
        <Editor selectedLayout={selectedLayout} onLayoutChange={(name) => {
          setSelectedLayout(name);
          setTree(layouts[name]);
        }} />
      )}
      <div className="flex min-w-0 w-full flex-1 flex-col overflow-auto">
        {tree ? renderNode(tree) : <p>Loading layouts...</p>}
      </div>
           {edit && (<Config />)}
    </div>
  );
}
