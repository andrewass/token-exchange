# AGENTS.md

This repository is a Bun + TypeScript service for OAuth 2.0 Token Exchange (RFC 8693).
It uses Hono for HTTP routing and a DDD-style folder layout.

## Quick start

1. Install dependencies: `bun install`
2. Run dev server: `bun run dev`
3. Default URL: `http://localhost:3050`

## Required environment

Set these environment variables before running:

- `ISSUER_BASE_URL` (issuer URL for this service)
- `STOCKCOMP_AUDIENCE` (resource server audience)
- `GOOGLE_ALLOWED_AUDIENCES` (comma-separated Google client IDs)

Optional:

- `LOG_LEVEL` one of `debug|info|warn|error`
- `LOG_CLIENT_ERRORS` set to `false` to suppress 4xx logs

## Key scripts

- `dev`: `bun run --hot src/server.ts`
- `lint`: `biome check .`
- `format`: `biome format --write .`

## Architecture and structure

DDD-style layout (see `src/`):

- `src/domain`: domain types, errors, ports
- `src/application`: use cases (token exchange)
- `src/infrastructure`: validators, registries, issuers, clock, logging
- `src/interfaces/http`: Hono HTTP routes
- `src/composition`: composition root wiring

Entry point: `src/server.ts` sets the Hono app on port 3050.

## HTTP surface

- `POST /tokens/token` OAuth-style token endpoint
- `GET /jwks` public keys for issued access tokens
- `GET /.well-known/oauth-authorization-server` discovery metadata

## Logging conventions

- Each request receives a `requestId` (header `x-request-id` in/out).
- 5xx are logged as errors; 4xx are warnings (unless `LOG_CLIENT_ERRORS=false`).

## Tooling

- TypeScript path aliases defined in `tsconfig.json`:
  - `@application/*`, `@composition/*`, `@domain/*`, `@infrastructure/*`, `@interfaces/*`
- Lint/format: `@biomejs/biome` via `bun run lint` and `bun run format`.

## Testing

There is no test runner configured yet.
If you add tests, prefer to introduce a single test command and document it here.

## Notes for contributors

- Keep new HTTP routes in `src/interfaces/http`.
- Prefer adding business logic in `src/application` and `src/domain`.
- Infrastructure concerns (token validation, issuance, storage) belong in `src/infrastructure`.
