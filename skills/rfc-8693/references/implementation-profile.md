# RFC 8693 Implementation Profile (token-exchange service)

This profile records the current behavior of this repository so protocol changes stay explicit.

## Endpoints

- Token endpoint: `POST /tokens/token`
- Discovery endpoint: `GET /.well-known/oauth-authorization-server`
- JWK Set endpoint: `GET /jwks`

## Supported Request Parameters

- `grant_type` (required): must be `urn:ietf:params:oauth:grant-type:token-exchange`
- `subject_token` (required)
- `subject_token_type` (required)
- `audience` (optional)
- `resource` (optional)
- `scope` (optional)
- `requested_token_type` (optional; defaults to access token type)

At least one target indicator is required: `audience` or `resource`.

## Supported Token Types

- Subject token types:
  - `urn:ietf:params:oauth:token-type:id_token`
- Requested/issued token types:
  - `urn:ietf:params:oauth:token-type:access_token`

## Validator and Issuer Profile

- Subject validator: Google ID token payload validation in
  `src/infrastructure/incomingTokens/google/googleIdTokenValidator.ts`
- Accepted issuers:
  - `https://accounts.google.com`
  - `accounts.google.com`
- Audience allowlist source:
  - `GOOGLE_ALLOWED_AUDIENCES` environment variable

- Issued access tokens:
  - JWT access token via local RSA keys
  - Key material served on `/jwks`

## Resource Server Profile

- Target audience source:
  - `STOCKCOMP_AUDIENCE` environment variable
- Default allowed scopes:
  - `stock:read`
  - `stock:trade`
  - `portfolio:read`
- Token lifetime:
  - 900 seconds

## OAuth Error Mapping

- `unsupported_grant_type` -> 400
- `invalid_request` -> 400
- `invalid_grant` -> 400
- `invalid_target` -> 400
- `unsupported_subject_token_type` -> 400
- `server_error` -> 500

## Discovery Metadata Expectations

`/.well-known/oauth-authorization-server` should include:

- `grant_types_supported` containing token exchange grant
- `subject_token_types_supported` matching registered validators
- `requested_token_types_supported` matching issuer capabilities

If protocol behavior changes, update this file in the same change.
