---
name: rfc-8693
description: RFC 8693 OAuth 2.0 Token Exchange implementation guide for this repository. Use when adding or changing /tokens/token behavior, token request validation, OAuth error mapping, discovery metadata, validator support, or issuer behavior tied to token exchange semantics.
---

# RFC 8693 Skill

Use this skill to keep token-exchange changes compliant with RFC 8693 while matching this service's current profile.

## Use This Repository Profile

Follow the implementation profile in `references/implementation-profile.md` before changing behavior.

Current profile summary:

- Grant type is fixed to `urn:ietf:params:oauth:grant-type:token-exchange`.
- Accepted subject token type is currently `urn:ietf:params:oauth:token-type:id_token` (Google ID token validator).
- Issued token type is currently `urn:ietf:params:oauth:token-type:access_token`.
- A target is required via `audience` or `resource`; unknown target returns `invalid_target`.
- Endpoint is `POST /tokens/token` and discovery is `GET /.well-known/oauth-authorization-server`.

## Change Workflow

1. Read these files first:
   - `src/interfaces/http/token/tokenRoutes.ts`
   - `src/application/tokenExchange/exchangeTokenUseCase.ts`
   - `src/interfaces/http/discovery/discoveryRoutes.ts`
   - `src/domain/tokenExchange/types.ts`
   - `src/domain/tokenExchange/errors.ts`
2. Preserve protocol-level behavior:
   - Parse OAuth form fields from request body.
   - Reject unsupported grant type with `unsupported_grant_type`.
   - Enforce required parameters with `invalid_request`.
   - Enforce target validation with `invalid_target`.
   - Reject unsupported `subject_token_type` with `unsupported_subject_token_type`.
3. Keep discovery metadata aligned with actual behavior:
   - `grant_types_supported`
   - `subject_token_types_supported`
   - `requested_token_types_supported`
4. If adding a new subject token type:
   - Add a validator implementing `IncomingTokenValidator`.
   - Register it in composition (`src/composition/createApp.ts`).
   - Update discovery supported types.
   - Update `references/implementation-profile.md`.
5. If adding a new issued token type:
   - Extend use-case validation and issuer implementation.
   - Update discovery supported requested token types.
   - Update response contract documentation and profile notes.

## Error Mapping Guardrails

Use OAuth error responses for protocol failures and keep HTTP statuses consistent:

- `unsupported_grant_type` -> 400
- `invalid_request` -> 400
- `invalid_grant` -> 400
- `invalid_target` -> 400
- `unsupported_subject_token_type` -> 400
- `server_error` -> 500

Avoid returning ad hoc error shapes from token exchange flow. Use `OAuthTokenExchangeError` for expected OAuth failures.

## Completion Checklist

- Token endpoint behavior and discovery metadata are in sync.
- Newly supported token types are wired in both registry/composition and discovery.
- OAuth error codes remain specific and stable.
- `AGENTS.md` and `references/implementation-profile.md` reflect the new behavior.
- Lint passes (`bun run lint`).
