/**
 * Enforces ai/rules/components.md.
 *
 * Every component in src/components/Sd*.tsx (except the documented exemptions)
 * MUST declare its props by extending SdComponentProps and MUST declare the
 * wildcard as `[key: string]: unknown`. Exits non-zero on any violation.
 *
 *   node scripts/check-component-props.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(root, "src", "components");
const basePath = join(root, "src", "models", "sd-component-props.ts");

/** Editor chrome: not registered in components/index.ts, not droppable content. */
const EXEMPT = new Map([
  ["SdSplitHandle.tsx", "editor chrome (drag handle), not a registered content component"],
]);

/** Strips comments so documentation prose can never satisfy a check. */
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(Math.max(0, m.length - p1.length)));

/** Returns every `interface Name ... { body }` with brace matching. */
const interfacesIn = (source) => {
  const found = [];
  const re = /\binterface\s+([A-Za-z_$][\w$]*)\b([^{]*)\{/g;
  for (let m = re.exec(source); m !== null; m = re.exec(source)) {
    let depth = 0;
    for (let i = m.index + m[0].length - 1; i < source.length; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}" && --depth === 0) {
        found.push({
          name: m[1],
          heritage: m[2],
          body: source.slice(m.index + m[0].length, i),
          line: source.slice(0, m.index).split("\n").length,
        });
        break;
      }
    }
  }
  return found;
};

/** The component's props interface: the one extending SdComponentProps, else any *Props. */
const propsInterfaceOf = (all) =>
  all.find((i) => /\bextends\s+[\w<>,\s.]*SdComponentProps\b/.test(i.heritage)) ??
  all.find((i) => i.name.endsWith("Props"));

const violations = [];
const fail = (file, line, message) => violations.push({ file, line, message });

// --- the base contract must not be weakened -------------------------------
const base = stripComments(readFileSync(basePath, "utf8"));
const baseInterface = interfacesIn(base).find((i) => i.name === "SdComponentProps");
if (!baseInterface) {
  fail("src/models/sd-component-props.ts", 0, "SdComponentProps interface not found");
} else {
  for (const prop of ["value", "config", "onChange", "eventIn", "children"]) {
    if (!new RegExp(`\\b${prop}\\s*\\?\\s*:`).test(baseInterface.body)) {
      fail("src/models/sd-component-props.ts", baseInterface.line, `base is missing \`${prop}\``);
    }
  }
  if (!/\[key:\s*string\]\s*:\s*unknown\s*;/.test(baseInterface.body)) {
    fail("src/models/sd-component-props.ts", baseInterface.line, "base wildcard must be `[key: string]: unknown`");
  }
  if (/\[key:\s*string\]\s*:\s*any\s*;/.test(baseInterface.body)) {
    fail("src/models/sd-component-props.ts", baseInterface.line, "base wildcard must not be `any`");
  }
  if (/(^|[\s;])data\s*\?\s*:/.test(baseInterface.body)) {
    fail("src/models/sd-component-props.ts", baseInterface.line, "base still declares `data`; the data prop is named `value`");
  }
}

// --- every registered component must conform -------------------------------
const files = readdirSync(componentsDir)
  .filter((f) => /^Sd.*\.tsx$/.test(f))
  .sort();

const checked = [];
for (const file of files) {
  if (EXEMPT.has(file)) {
    checked.push(`  ~ ${file} (exempt: ${EXEMPT.get(file)})`);
    continue;
  }

  const rel = `src/components/${file}`;
  const source = stripComments(readFileSync(join(componentsDir, file), "utf8"));
  const props = propsInterfaceOf(interfacesIn(source));

  if (!props) {
    fail(rel, 0, "no props interface found");
    continue;
  }

  if (!/\bextends\s+[\w<>,\s.]*SdComponentProps\b/.test(props.heritage)) {
    fail(rel, props.line, `${props.name} must extend SdComponentProps from ../models/sd-component-props`);
  }
  if (!/\[key:\s*string\]\s*:\s*unknown\s*;/.test(props.body)) {
    fail(rel, props.line, `${props.name} must declare the wildcard \`[key: string]: unknown\``);
  }
  if (/\[key:\s*string\]\s*:\s*any\s*;/.test(props.body)) {
    fail(rel, props.line, `${props.name} declares \`[key: string]: any\`; use \`unknown\` (ai/rules/components.md §2)`);
  }
  if (/(^|[\s;])data\s*\?\s*:/.test(props.body)) {
    fail(rel, props.line, `${props.name} declares \`data\`; the data prop is named \`value\` (ai/rules/components.md §1)`);
  }

  checked.push(`  v ${file} -> ${props.name}`);
}

// --- report ---------------------------------------------------------------
console.log(`Component props contract (ai/rules/components.md)\n\n${checked.join("\n")}\n`);

const conformed = checked.filter((l) => l.startsWith("  v ")).length;
if (violations.length === 0) {
  console.log(`OK - ${conformed} components conform.`);
  process.exit(0);
}

for (const v of violations) {
  console.error(`FAIL ${v.file}:${v.line} ${v.message}`);
}
console.error(`\n${violations.length} violation(s). See ai/rules/components.md.`);
process.exit(1);