# Bun TypeScript Reference Notes

This file captures the source baseline used to define the `bun-typescript-service` skill.
Refresh with Context7 before major Bun upgrades.

## Verification metadata

- Last verified: 2026-03-30
- Verification method: Context7 against Bun official docs/repository sources
- Primary Context7 library:
  - `/oven-sh/bun`

## Source baseline

- Bun README command workflow:
  - https://github.com/oven-sh/bun/blob/main/README.md
- Bun command mapping and core CLI:
  - https://github.com/oven-sh/bun/blob/main/src/init/rule.md
- Bun environment variable behavior:
  - https://github.com/oven-sh/bun/blob/main/docs/runtime/environment-variables.mdx
  - https://github.com/oven-sh/bun/blob/main/docs/guides/runtime/set-env.mdx
- Bun watch/hot behavior:
  - https://github.com/oven-sh/bun/blob/main/docs/runtime/watch-mode.mdx
  - https://github.com/oven-sh/bun/blob/main/docs/guides/http/hot.mdx
- Bun test runtime behavior:
  - https://github.com/oven-sh/bun/blob/main/docs/test/runtime-behavior.mdx
  - https://github.com/oven-sh/bun/blob/main/docs/test/code-coverage.mdx

## Current standards extracted from sources

1. Bun is an all-in-one runtime + package manager + test runner + bundler; prefer Bun-native commands over mixed toolchains.
2. `bun run <script>` uses Bun shell and supports cross-platform env-variable assignment in `package.json` scripts.
3. Bun auto-loads env files with precedence `.env` < `.env.<NODE_ENV>` < `.env.local` (`.env.local` skipped for test env).
4. `--watch` and `--hot` are different:
- `--watch` restarts the process.
- `--hot` performs a soft reload and preserves global state.
5. Bun CLI flags such as `--watch`/`--hot` should be placed immediately after `bun`.
6. Bun test supports external env files and coverage filtering via CLI flags.
