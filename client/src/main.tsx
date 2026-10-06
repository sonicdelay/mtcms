import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./router";
import "./lib/i18n";
import "./stylesheets/globals.css";
import "./stylesheets/fonts.css";
import "./lib/actionhandler";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

// Compile Tailwind utilities for classes that only exist in the DOM at runtime
// (classNames typed in the editor, classes coming from boards/*.json). Loaded
// after the first render so it does not delay initial paint.
void import("@tailwindcss/browser");
