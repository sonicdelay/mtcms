# Game API rules

Scope: `server/src/routes/`. These apply on top of
`controller-structure.md`, which governs file layout. This file covers the
semantics that matter once endpoints carry player state.

## Mounting and prefixes

Routers mount at the app root, so an unscoped `router.use(middleware)` applies
to **every request in the application**, including `/api` itself. Always scope:

```ts
router.use(`${prefix}`, authRequired);
```

Attach auth before the handlers in the chain, not after. A route that relies on
a sibling router's middleware for protection is unprotected.

## Identity and ownership

Authentication answers "who is calling". It does not answer "may they touch
this row". Any endpoint that takes a player, match, or session id must also
check that the caller owns it. Prefer scoping the query by the authenticated
user (`where user_id = $1`) over fetching and then comparing — a comparison
added later is a comparison someone will forget.

Return `404` rather than `403` when a row exists but belongs to someone else, so
the response does not confirm the id is real.

## State writes

- Writes are never behind `GET`. A retried `GET` must not change state.
- Score and progress submissions need an idempotency guard (a request id or a
  natural key) so a client retry cannot double-count.
- Do not trust client-computed values for anything that can be cheated: send the
  inputs and let the server compute the score, or validate the submitted value
  against the server's own simulation.
- Bound every list query. An unbounded `select` on a growing table is a latency
  bug and a memory bug.

## Errors

Use the project's problem shape, RFC 7807: `type`, `title`, `status`, `detail`.
Never return a bare `{ error: "…" }`. Never leak a stack trace, SQL text, a
connection string, or an internal identifier to the client. Log the cause, send
the problem document.

## Validation

Validate `req.body`, `req.params`, and `req.query` before use: presence, type,
and range. Do not index into a body without checking it exists — a malformed
request must produce `400`, not a `500` from a `TypeError`.

## Spec

The OpenAPI document is served at `/api/openapi.yaml`. A new or renamed endpoint,
parameter, or status code must be reflected there in the same change. The spec is
the client contract; drift is a silent break.

## Auth surface

Public: `/api/` (Swagger) and `/api/openapi.yaml`.
Protected by JWT: `/api/nodes`, `/api/fm`. Tokens are HS256, obtained from
`POST /api/auth` with email and password, sent as
`Authorization: Bearer <token>`.

A new game route is protected unless there is a written reason it is not, and
"the client needs it before login" is the only good one — in which case say so in
the spec.
