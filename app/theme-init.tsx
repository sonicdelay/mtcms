"use client";

import { useServerInsertedHTML } from "next/navigation";

const themeInitScript = `(function(){try{var s=JSON.parse(localStorage.getItem("app-store-storage")||"{}").state,t=s&&s.theme;if(t==="dark"||t==="light")document.documentElement.classList.add(t);else if(matchMedia("(prefers-color-scheme:dark)").matches)document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function ThemeInit() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
  ));
  return null;
}
