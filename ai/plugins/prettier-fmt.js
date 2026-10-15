/**
 * Prettier format-on-startup for OpenCode V2.
 *
 * Injects a one-time instruction into each top-level session's first request,
 * so the agent runs `npm run fmt` at the start of the session.
 *
 * Dependency-free on purpose (no `@opencode/plugin` import): like the
 * superpowers plugin, it relies only on the host `ctx` and the default export
 * `{ id, setup }` that OpenCode V2 reads. Nothing here may throw, or the whole
 * plugin generation could be disabled.
 */

const MARKER = "[prettier-fmt:startup]";

const INSTRUCTION = `${MARKER}
Before responding to the user's first request, run \`npm run fmt\` from the repository root to normalize formatting, then continue with the task. Only mention it if formatting fails.`;

export default {
  id: "prettier-fmt",
  async setup(ctx) {
    if (!ctx || !ctx.session || typeof ctx.session.hook !== "function") return;

    try {
      await ctx.session.hook("context", async (event) => {
        try {
          const messages = event && event.messages;
          if (!Array.isArray(messages) || messages.length === 0) return;

          // Skip subagent (child) sessions: only top-level sessions "start up".
          if (event.sessionID && typeof ctx.session.get === "function") {
            try {
              const found = await ctx.session.get({
                sessionID: event.sessionID,
              });
              const session = found && found.data ? found.data : found;
              if (session && session.parentID) return;
            } catch {
              // Fail open: inject anyway when the lookup fails.
            }
          }

          const firstUser = messages.find((m) => m.role === "user");
          if (
            firstUser &&
            (!firstUser.content || firstUser.content.length === 0)
          ) {
            return;
          }

          const parts = firstUser ? firstUser.content : undefined;
          if (
            parts &&
            parts.some(
              (p) =>
                p &&
                p.type === "text" &&
                typeof p.text === "string" &&
                p.text.includes(MARKER),
            )
          ) {
            return;
          }

          const part = { type: "text", text: INSTRUCTION };
          if (firstUser) {
            firstUser.content.unshift(part);
          } else {
            messages.push({ role: "user", content: [part] });
          }
        } catch {
          // Never break the request pipeline.
        }
      });
    } catch {
      // Never break plugin activation.
    }
  },
};
