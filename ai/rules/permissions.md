# Permission grants

Scope: the `permissions` array in the project root `opencode.jsonc`.

## Rule

When OpenCode asks for a permission and the user grants it, **record the grant
in `opencode.jsonc`**. Do not rely on the session's saved approval alone.

1. Read the `permissions` array in `opencode.jsonc`.
2. Add one rule for the granted resource:
   `{ "action": "<action>", "resource": "<pattern>", "effect": "allow" }`.
3. **Append it at the end of the array.** V2 resolves an action by the _last_
   matching rule, so an appended rule overrides everything above it — including
   the deliberate `ask` rules for destructive commands. A rule inserted in the
   middle can be silently overridden by a later rule for the same resource.
4. Keep the pattern exactly as narrow as the grant: a command prefix
   (`Get-ChildItem *`, `npm run lint *`), never `*`.
5. Leave every other rule, comment, and key in the file alone.

Do this after the grant, in the same turn. It is a one-line addition and it is
the whole point of keeping the grants in the repo.

## Why the project file and not the client's saved approval

OpenCode's **Allow always** already persists a grant — in its own local
database (`~/.local/share/opencode/opencode.db`, table `permission`), keyed by
project id. That state is invisible to the repository, is not shared, and is
lost when the database is reset. `opencode.jsonc` is tracked, so the grant
shows up in a diff, survives a reset, and reaches the team.

The database and the config file are complementary: the database decides what
happens in the current session, the config file is the record of what the
project has agreed to.

## Matching rules that decide the pattern

- Actions and resources are whole-value wildcards: `*` matches any run of
  characters, `?` matches exactly one. A shell pattern ending in ` *` also
  matches the command with no arguments (`git status *` matches `git status`).
- The `shell` resource is the scanner-produced command string, not the file
  it touches. `Get-ChildItem *` allows `Get-ChildItem -Force <path>`.
- A compound command (a pipeline) produces **several** resources, and every
  segment needs its own allow rule. `Get-ChildItem x | Select-Object Name`
  needs both `Get-ChildItem *` and `Select-Object *`.
- Path patterns match the entire normalized path; backslashes become forward
  slashes and matching is case-insensitive on Windows.

## What stays prompt-gated

The file keeps an explicit `ask` block for commands that destroy work, publish
it, or run code fetched from the network: `git push`, `git reset`,
`git checkout`, `git clean`, `git rebase`, `Remove-Item`, `Move-Item`,
`Copy-Item`, `Set-Content`, `Out-File`, `Stop-Process`, `Start-Process`,
`npm install`, `npm i`, `npm start`, `npx -y`, `npx --yes`, `curl`,
`Invoke-WebRequest`, `Invoke-RestMethod`, `bash`, `cmd`, `sh`, `python -c`.

A one-off approval is not a standing invitation, and this file is committed:
a blanket `allow` here hands the same access to everyone who clones the repo.
To keep one of them permanently, add an `allow` rule at the end of the array
— but only when the user asks for that specifically.
