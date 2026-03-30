---
name: bun-typescript-service
description: Bun + TypeScript backend workflow for runtime commands, package management, script conventions, environment variable loading, watch/hot reload behavior, and Bun test execution. Use when creating, debugging, or refactoring Bun-based services.
---

# Bun TypeScript Service

Use this skill to keep Bun service workflows consistent and predictable.

## Scope and precedence

- This skill is authoritative for Bun runtime/tooling behavior and script conventions.
- Pair with `hono-http-service` for HTTP API design and route behavior.
- Pair with `rfc-8693` when protocol semantics are in scope.

## Workflow

1. Confirm project runtime contract
- Read `package.json` scripts and `bunfig.toml` before changing commands.
- Prefer Bun-native commands and avoid mixing npm/pnpm/yarn unless explicitly requested.

2. Use Bun-native command equivalents
- Run app entry files with `bun <file>`.
- Run scripts with `bun run <script>`.
- Install dependencies with `bun install` (or `bun install <pkg>` when adding a package).
- Execute one-off CLIs with `bunx <package> <command>`.

3. Apply Bun environment handling rules
- Use `Bun.env` or `process.env` for environment access.
- Rely on Bun auto-loading order:
  - `.env`
  - `.env.<NODE_ENV>` (`.env.development`, `.env.test`, `.env.production`)
  - `.env.local` (except when `NODE_ENV=test`)
- For test-specific env files, use `bun test --env-file .env.test`.

4. Choose reload mode deliberately
- Use `bun --watch ...` when full process restart is desired.
- Use `bun --hot ...` when soft reload is preferred and persisted global state is acceptable.
- Place Bun flags immediately after `bun` (for example `bun --watch run dev`, not `bun run dev --watch`).

5. Run tests with Bun test runner
- Use `bun test` for default test execution.
- Use coverage and test filters when narrowing scope, for example:
  - `bun test --coverage`
  - `bun test --coverage --test-name-pattern=\"API\"`

6. Verify completion
- Run project lint/format scripts after command or script changes.
- Check that script names in docs and AGENTS files still match `package.json`.

## Optional project overlay

- In this repo, dev mode currently uses `bun run --hot src/server.ts`.
- Keep script changes aligned with this repo's DDD layout and current entrypoint (`src/server.ts`).

## References

- Use [references/bun-typescript-reference.md](references/bun-typescript-reference.md) for the current source baseline.
- Refresh with Context7 before making major version-related workflow changes.
