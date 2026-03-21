---
name: rfc-8693
description: RFC 8693 OAuth 2.0 Token Exchange implementation guide. Use when designing, implementing, or reviewing token exchange behavior, request validation, OAuth error mapping, discovery metadata, supported token types, and issuer/validator changes.
---

# RFC 8693 Skill

Use this skill to keep token-exchange behavior compliant with RFC 8693 while staying explicit about local implementation choices.

## Establish Local Profile First

Before changing code, identify the app's local profile (for example in `AGENTS.md`, `README.md`, or a project-specific profile doc). If no profile exists, create one in project docs before implementing behavior changes.

Do not assume fixed token types, endpoints, or provider-specific validators unless local profile docs say so.

## Change Workflow

1. Read the token endpoint implementation, use case/application layer, discovery metadata route, and OAuth error model.
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
   - Register it in the application's composition/bootstrap wiring.
   - Update discovery supported types.
   - Update local profile documentation.
5. If adding a new issued token type:
   - Extend use-case validation and issuer implementation.
   - Update discovery supported requested token types.
   - Update response contract documentation and local profile notes.

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
- Newly supported token types are wired in both validator/issuer registration and discovery.
- OAuth error codes remain specific and stable.
- Local profile documentation reflects new behavior.
- Project lint/tests pass.
