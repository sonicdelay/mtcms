import { defineConfig, type Logger, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

interface Timing {
  label: string;
  ms: number;
}

const fmt = (ms: number) => `${ms.toFixed(0).padStart(6)} ms`;

const table = (title: string, entries: Timing[]) => {
  const width = Math.max(0, ...entries.map((e) => e.label.length));
  return [
    `  ${title}`,
    ...entries.map((e) => `  ${e.label.padEnd(width)}  ${fmt(e.ms)}`),
  ];
};

const bundleTiming = (): Plugin => {
  const chunks: Timing[] = [];
  let logger: Logger;
  let tBuild = 0;
  let tRender = 0;
  let tGenerated = 0;
  let tWritten = 0;
  let tChunk = 0;

  return {
    name: "bundle-timing",
    apply: "build",
    configResolved(config) {
      logger = config.logger;
    },
    buildStart() {
      tBuild = tRender = tChunk = performance.now();
    },
    renderStart() {
      tRender = tChunk = performance.now();
    },
    renderChunk(_code, chunk) {
      const now = performance.now();
      chunks.push({ label: chunk.fileName, ms: now - tChunk });
      tChunk = now;
      return null;
    },
    generateBundle() {
      tGenerated = performance.now();
    },
    writeBundle() {
      tWritten = performance.now();
    },
    closeBundle() {
      const phases: Timing[] = [
        { label: "transform", ms: tRender - tBuild },
        { label: "render", ms: tGenerated - tRender },
        { label: "write", ms: tWritten - tGenerated },
      ];
      const ranked = [...chunks].sort((a, b) => b.ms - a.ms);
      logger.info(
        [
          `bundle timing: ${fmt(performance.now() - tBuild).trim()} total`,
          ...table("phases", phases),
          ...table(
            `chunks (${chunks.length}, slowest first)`,
            ranked.slice(0, 10),
          ),
        ].join("\n"),
      );
    },
  };
};

export default defineConfig({
  plugins: [react(), tailwindcss(), bundleTiming()],
  server: {
    host: "0.0.0.0",
  },
  build: {
  },
});
