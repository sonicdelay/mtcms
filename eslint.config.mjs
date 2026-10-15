import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.backup/**",
      "server/media/**",
      "client/public/**",
      ".fallow/**",
      ".opencode/**",
      ".superpowers/**",
      "package-lock.json",
      "**/*.lock",
      "client/node_modules/**",
      "server/node_modules/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Redundant with TypeScript, and noisy across browser + node code.
      "no-undef": "off",
      // Pre-existing debt (from the deno lint baseline): keep visible as
      // warnings instead of changing behavior to satisfy them.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-unused-vars": "off",
    },
  },
);
