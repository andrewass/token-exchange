---
name: hono-http-service
description: Hono HTTP API workflow for app composition, route grouping, middleware order, request parsing and validation, context variables, and centralized error handling. Use when creating, debugging, or refactoring Hono-based services.
---

# Hono HTTP Service

Use this skill to implement Hono APIs with consistent routing, middleware, and error behavior.

## Scope and precedence

- This skill is authoritative for Hono HTTP-layer implementation patterns.
- Pair with `bun-typescript-service` for runtime scripts and execution behavior.
- Pair with `rfc-8693` when token exchange protocol behavior is involved.

## Workflow

1. Structure app and modules
- Initialize service modules with `new Hono()`.
- Keep route groups modular and mount with `app.route('/prefix', moduleApp)`.
- Prefer stable route prefixes and avoid ad hoc route construction in handlers.

2. Apply middleware in correct order
- Register global middleware with `app.use()` before route handlers that depend on it.
- Remember execution order: middleware runs top-down before `await next()` and unwinds in reverse order after.
- Keep middleware single-purpose (request IDs, auth, logging, context enrichment).

3. Handle request data with explicit validation
- Use Hono validator middleware for `param`, `query`, `json`, and `form` inputs.
- Chain validators when multiple input sources are required.
- Read validated inputs via `c.req.valid('<target>')`.
- For JSON payloads, require correct `Content-Type` handling in clients/tests.

4. Use typed context variables for shared request state
- Set request-scoped values with `c.set(...)`.
- Read shared values with typed context (`c.var.*` or strongly typed bindings as configured in the app).
- Prefer typed middleware (`createMiddleware`) for reusable context contracts.

5. Standardize not-found and error responses
- Return explicit status codes with `c.json(payload, status)` or `c.text(...)`.
- Define app-level `.notFound(...)` and `.onError(...)` handlers for consistent error shape.
- Use `c.notFound()` when route-level flow intentionally delegates to the global 404 handler.

6. Verify completion
- Confirm mounted routes still resolve under expected prefixes.
- Confirm middleware side effects (for example request ID propagation) on both success and error paths.
- Confirm validation failures map to stable HTTP 4xx responses.

## Optional project overlay

- In this repo, route groups are mounted from the composition root under `/tokens`, `/jwks`, and `/.well-known`.
- Request IDs are propagated with `x-request-id` and carried in request context for logging.

## References

- Use [references/hono-http-reference.md](references/hono-http-reference.md) for the current source baseline.
- Refresh with Context7 before changing validation or error-model behavior.
