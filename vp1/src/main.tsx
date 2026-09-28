import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./actionhandler";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Compile Tailwind utilities for classes that only exist in the DOM at runtime
// (classNames typed in the editor, classes coming from boards/*.json). Loaded
// after the first render so the 280 kB engine does not delay it.
void import("@tailwindcss/browser");
