# Plan: OpenCode tooling for TypeScript game API + 3D content

Date: 2026-10-22
Branch: `feat/opencode-game-api-3d-tooling`

## Goal

Equip the mtCMS repo's OpenCode setup with tooling aimed at two work areas that
had none: (a) TypeScript-heavy game/API server work, and (b) Babylon.js 3D
content work. The repo already had superpowers, a Blender MCP, a Playwright MCP,
one reviewer agent, and a Prettier formatter.

## Context

- Client: React 19 + Vite + `@babylonjs/lite` + `@babylonjs/havok`. The 3D
  engine view lives in `client/src/routes/engine/` (`engine-scene-lite.tsx`,
  `engine-scene-lite-controller.ts`, `scene-objects-lite.ts`,
  `engine-scene-inspector-panel.tsx`).
- Server: Express 5 on Node, TypeScript run via type stripping. Routers mount
  at the root, so `router.use()` must be scoped to the router's `${prefix}`.
  Swagger/OpenAPI at `/api/`, RFC 7807 problem responses.
- OpenCode v2.0.30. Config: `opencode.jsonc` (project), `ai/` (instructions,
  rules, skills), `.opencode/agents/` (markdown agents).
- Known V2 constraints already documented in `opencode.jsonc`:
  - `agents` must be an object of definitions; markdown agents are discovered
    from `.opencode/agents/*.md`.
  - `mcp.servers.*.command` must be an array; elements spawn directly with no
    shell, so `%USERPROFILE%` and `{env:NAME}` are not expanded there.
  - `.opencode/skills` is auto-discovered; `ai/skills` is not (it is listed
    explicitly in the `skills` array).

## Tasks

### T1 — Turn on TypeScript language support

Add `"lsp": true` and `"experimental": { "todo": true }` to `opencode.jsonc`.
LSP is disabled by default in OpenCode; the built-in `typescript` server covers
`.ts/.tsx/.js/.jsx` and only needs the `typescript` dependency already present.
`experimental.todo` supplies the `todowrite` tool the superpowers workflow
expects but V2 does not ship by default.

### T2 — Register project rules

Add `"instructions": ["ai/rules/*.md"]` and author two rule files:
`ai/rules/babylon-engine.md` (scene lifecycle, disposal, physics, asset
loading) and `ai/rules/game-api.md` (endpoint shape, prefix scoping, OpenAPI
sync, RFC 7807, auth).

### T3 — Add plugins

Add to the `plugins` array:
`@nick-vi/opencode-type-inject`, `@tarquinen/opencode-dcp`,
`opencode-api-security-testing`, `opencode-pty`.
Skip `oh-my-opencode` (workflow overlaps superpowers) and `opencode-supabase`
(backend is `pg`/Neon, not Supabase).

### T4 — Add 3D MCP servers

Add all seven `@babylonjs/mcp-servers` dispatchers (`nme`, `nge`, `npe`, `nrge`,
`gui`, `flow-graph`, `smart-filters`) pinned to 9.32.0, plus MCP Browser World
(Babylon.js adapter) and the Spector.js MCP server (WebGL draw-call and shader
inspection) where buildable in this environment.

### T5 — Author the Babylon engine skill

Create `ai/skills/babylon-engine/SKILL.md`. RED first: run a baseline subagent
against the engine route before the skill exists, record what it gets wrong,
then write the skill to address exactly those failures and re-run to confirm.

### T6 — Author specialist agents

Create `.opencode/agents/engine-reviewer.md`, `.opencode/agents/api-contract-reviewer.md`,
and `.opencode/agents/perf-profiler.md`.

### T7 — Install third-party skills

Install the cross-engine discipline skills from
`gamedev-skills/awesome-gamedev-agent-skills` via the `skills` CLI, targeted at
OpenCode. Engine-specific skills for other engines are not useful here.

### T8 — Verify and commit

Validate `opencode.jsonc` against the published schema, confirm plugin
resolution, confirm skill and agent discovery, run Prettier over the new
Markdown, and commit.

## Global constraints

- Do not change application code. Configuration, rules, skills, and agents only.
- Prettier formats Markdown in this repo; new `.md` files must be
  `npm run fmt:check` clean or the repo gate breaks.
- Every new file must be justified by the repo's own conventions, not by
  generic advice.

## Review focus

- Does the TypeScript LSP actually engage in this repo's layout (root
  `typescript` dep, `client/` and `server/` sub-packages)?
- Are the MCP `command` arrays valid for OpenCode's shell-less spawn on
  Windows, given `npx` and `uvx` already work in this config?
- Do the new agents and skill duplicate `ai/rules/*` content, or complement it?
- Is anything added that conflicts with superpowers' existing scope?
