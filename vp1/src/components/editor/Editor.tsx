import { useEffect, useState } from "react";
import { layouts, loadLayouts } from "../../layoutTree";
import { palette } from "../../editor/registry";
import { sdButtonObject } from "../SdButton";

interface EditorProps {
  selectedLayout: string;
  onLayoutChange: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetLayout: () => void;
}

const sendAction = (type: string, payload?: unknown) => {
  globalThis.sd.dispatchAction({ type, payload });
};

const onButtonClicked = (action: { type: string; payload?: unknown }) => {
  console.log("Action received:", action);
};

const Editor = ({
  selectedLayout,
  onLayoutChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetLayout,
}: EditorProps) => {
  const [handlerCount, setHandlerCount] = useState(0);
  const [handlers, setHandlers] = useState(() => globalThis.sd.listHandlers());
  const [layoutNames, setLayoutNames] = useState<string[]>([]);

  const refreshHandlers = () => {
    setHandlerCount(globalThis.sd.getHandlerCount());
    setHandlers(globalThis.sd.listHandlers());
  };

  const addHandler = () => {
    refreshHandlers();
    globalThis.sd.addHandler("logger", "button_click", onButtonClicked);
  };

  const removeHandler = () => {
    refreshHandlers();
    globalThis.sd.removeHandler();
  };

  useEffect(() => {
    globalThis.sd.resetHandlerState();
    refreshHandlers();
    loadLayouts().then(() => setLayoutNames(Object.keys(layouts)));
  }, []);

  const paletteItems = Object.values(palette);

  return (
    <div className="Editor bg-gray-700 border-none">
      <h3>Editor (F8)</h3>
      <button onClick={() => sendAction("button_click", "Button clicked!")}>
        Clicked
      </button>
      <button onClick={() => sendAction("button_click", "Button fired!")}>
        Fired
      </button>
      <img
        src={sdButtonObject.image}
        alt={sdButtonObject.name}
        title={sdButtonObject.tooltip}
      />

      <button onClick={addHandler}>+ Handler</button>
      <button onClick={removeHandler}>- Handler</button>
      <p>Active handlers: {handlerCount}</p>
      <ul>
        {handlers.map((h) => (
          <li key={`${h.name}-${h.type}`}>{h.name}: {h.type}</li>
        ))}
      </ul>
      <hr />
      <label className="block text-sm bg-gray-700">Dashboard Layout</label>
      <select
        className="w-full p-1 bg-gray-800 text-white border border-gray-600 rounded"
        value={selectedLayout}
        onChange={(event) => onLayoutChange(event.target.value)}
      >
        {layoutNames.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      <hr />
      <label className="block text-sm bg-gray-700">Components</label>
      <ul>
        {paletteItems.map((item) => (
          <li
            key={item.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("component-type", item.type);
              e.dataTransfer.effectAllowed = "copy";
            }}
          >
            {item.title}
          </li>
        ))}
      </ul>
      <hr />
      <div className="flex flex-col gap-1">
        <button onClick={onUndo} disabled={!canUndo}>Undo</button>
        <button onClick={onRedo} disabled={!canRedo}>Redo</button>
        <button onClick={onResetLayout}>Reset Layout</button>
      </div>
    </div>
  );
};

export default Editor;