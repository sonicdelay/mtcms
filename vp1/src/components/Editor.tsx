import { useEffect, useState } from "react";
import { layouts, loadLayouts } from "../layoutTree";

const componentList = ["Editor", "Wave", "Gauge"];

interface EditorProps {
  selectedLayout: string;
  onLayoutChange: (name: string) => void;
}

const sendAction = (type: string, payload?: unknown) => {
  globalThis.sd.dispatchAction({ type, payload });
};

const onButtonClicked = (action: { type: string; payload?: unknown }) => {
  console.log("Action received:", action);
};

const Editor = ({ selectedLayout, onLayoutChange }: EditorProps) => {
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

  return (
    <div className="Editor bg-gray-700 border-none">
      <h3>Editor</h3>
      <button onClick={() => sendAction("button_click", "Button clicked!")}>Clicked</button>
      <button onClick={() => sendAction("button_click", "Button fired!")}>Fired </button>

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
      <ul>
        {componentList.map((component) => (
          <li key={component} draggable="true">{component}</li>
        ))}
      </ul>
    </div>
  );
};

export default Editor;