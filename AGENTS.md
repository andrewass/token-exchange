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

## Runtime and tooling policy

- Use Bun for install/run/test tasks in this repository.
- Do not default to npm/pnpm/yarn unless explicitly requested.

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
If you add tests, introduce a single canonical test command (for example `test`) in `package.json` and document it here.

## Verification policy

- After code changes, run `bun run lint` and `bun run format`.
- Once tests are configured, run the canonical test command as part of verification.
- Never claim checks or tests passed if they were not executed.
- If execution is blocked, report exactly what was not run and why.

## Notes for contributors

- Keep new HTTP routes in `src/interfaces/http`.
- Prefer adding business logic in `src/application` and `src/domain`.
- Infrastructure concerns (token validation, issuance, storage) belong in `src/infrastructure`.

## Dependency and import hygiene

- When introducing new imports/framework APIs, verify required dependencies in `package.json` in the same change.
- If a change introduces unresolved imports due to missing dependencies, update `package.json` as part of the same update.
- Remove unused imports in touched files before finishing.

## Config and secrets hygiene

- Never hardcode secrets in code or committed config.
- Use environment variables for secrets and keep required env keys documented in `AGENTS.md`.

## HTTP contract guardrails

- When token endpoint behavior changes, update discovery metadata and OAuth error mapping in the same PR.
- Keep the RFC 8693 local profile section synchronized with actual runtime behavior.

## Commit conventions

- Commit messages must start with a capital letter.

## Repository skills

- Bun service workflow skill: `.agents/skills/core/bun-typescript-service/SKILL.md`
- Hono HTTP skill: `.agents/skills/api/hono-http-service/SKILL.md`
- RFC 8693 implementation skill: `skills/rfc-8693/SKILL.md`
- Use RFC 8693 skill when changing token exchange semantics, OAuth error mapping, supported token types, or discovery metadata.

## Skills

- Skills under `.agents/skills/**` should be repo-agnostic by default so they can be reused across projects.
- Place reusable skills in `.agents/skills/**` as the default location.
- Do not hardcode repository names, repo-specific paths, or project-only assumptions in reusable skills.
- If project-specific behavior is needed, keep it clearly marked as optional project overlay guidance.
- If `.agents/skills/**` is not writable, stop and ask the user how to proceed before creating skills in any alternate directory.

## Skill folder grouping

- Group skills by domain under `.agents/skills/**` to keep the root tidy.
- Preferred groups:
  - `core/` language/runtime/tooling fundamentals
  - `api/` HTTP contracts, routing, middleware, validation
  - `security/` protocol and token/security semantics
  - `integration/` outbound clients and external APIs
  - `ops/` observability and runtime operations
  - `test/` testing strategy and specialized testing skills

## Skill update guardrails

- Treat every skill listed in `skills-lock.json` as read-only.
- When asked to update skills, only modify skills not listed in `skills-lock.json`.
- If a requested skill is listed in `skills-lock.json`, do not edit it unless the user explicitly says `override lock for <skill-name>`.
- Do not modify `skills-lock.json` unless explicitly requested.
- If lock status is unclear, stop and ask before editing.

## Skill routing

- If the user says `use relevant skills`, automatically select and apply all matching skills from `.agents/skills/**`.
- If the user names a skill explicitly (for example `$hono-http-service`), always include it.
- Activate `bun-typescript-service` for Bun runtime usage, scripts, package commands, env loading, watch/hot mode, and Bun test conventions.
- Activate `hono-http-service` for Hono route/module composition, middleware ordering, request validation, context variables, and HTTP error handling.
- Activate `rfc-8693` for OAuth token exchange semantics, discovery metadata parity, token-type support, and OAuth error mapping.
- For mixed tasks, combine all relevant skills rather than choosing only one.
- Use this priority when guidance conflicts: protocol correctness and security (`rfc-8693`) before HTTP contract behavior (`hono-http-service`) before runtime/tooling ergonomics (`bun-typescript-service`).

## Skill conflict resolution

- Overlap between skills is allowed when it improves standalone usability.
- For overlapping topics, prefer the most specialized active skill for concrete implementation details.
- Treat protocol skills as authoritative for OAuth semantics, and framework/runtime skills as implementation mechanics.

## RFC 8693 local profile

This section is repository-specific and documents the current implementation choices.

- Token endpoint: `POST /tokens/token`
- Discovery endpoint: `GET /.well-known/oauth-authorization-server`
- JWK Set endpoint: `GET /jwks`
- Required `grant_type`: `urn:ietf:params:oauth:grant-type:token-exchange`
- Required request fields: `subject_token`, `subject_token_type`, and one target via `audience` or `resource`
- Supported `subject_token_type`: `urn:ietf:params:oauth:token-type:id_token`
- Supported issued token type: `urn:ietf:params:oauth:token-type:access_token`
- Target audience source: `STOCKCOMP_AUDIENCE`
- Google client allowlist source: `GOOGLE_ALLOWED_AUDIENCES`
- OAuth error/status mapping:
  - `unsupported_grant_type`, `invalid_request`, `invalid_grant`, `invalid_target`, `unsupported_subject_token_type` -> `400`
  - `server_error` -> `500`

If protocol behavior changes, update this section in the same PR.
