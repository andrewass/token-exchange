# Hono HTTP Reference Notes

This file captures the source baseline used to define the `hono-http-service` skill.
Refresh with Context7 before major Hono upgrades.

## Verification metadata

- Last verified: 2026-03-30
- Verification method: Context7 against Hono official documentation
- Primary Context7 library:
  - `/websites/hono_dev`

## Source baseline

- Hono app API and handlers:
  - https://hono.dev/docs/api/hono
- Routing and route grouping:
  - https://hono.dev/docs/api/routing
- Bun starter for Hono:
  - https://hono.dev/docs/getting-started/bun
- Middleware behavior and order:
  - https://hono.dev/docs/guides/middleware
- Request validation:
  - https://hono.dev/docs/guides/validation
- Request ID middleware:
  - https://hono.dev/docs/middleware/builtin/request-id
- Typed not-found/error modeling examples:
  - https://hono.dev/docs/guides/rpc

## Current standards extracted from sources

1. Hono apps should be composed from `new Hono()` modules and mounted via `app.route(...)` for larger services.
2. Middleware order is deterministic and should be intentionally controlled before route handlers.
3. Request validation is middleware-driven and should use `validator(...)` + `c.req.valid(...)` for typed inputs.
4. Correct `Content-Type` headers are required for reliable JSON validation behavior.
5. Shared request state should be passed through typed context variables (`c.set`, `c.var`, or typed bindings).
6. Global `.onError(...)` and `.notFound(...)` handlers should be used for consistent API error contracts.
