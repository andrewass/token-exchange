# token-exchange

DDD skeleton for OAuth 2.0 Token Exchange (RFC 8693), focused on exchanging external subject tokens (currently Google ID tokens) into access tokens for resource servers (currently `stockcomp`).

## Run

```bash
bun install
bun run dev
```

Server defaults to `http://localhost:3050`.

## Endpoints

- `POST /tokens/token` (OAuth-style token endpoint)
- `GET /jwks` (public keys for issued access tokens)
- `GET /.well-known/oauth-authorization-server` (metadata)

## Environment variables

- `ISSUER_BASE_URL`
- `GOOGLE_ALLOWED_AUDIENCES` comma-separated allowed Google client IDs
- `STOCKCOMP_AUDIENCE`
- `LOG_LEVEL` one of `debug|info|warn|error`
- `LOG_CLIENT_ERRORS` set to `false` to suppress 4xx logs (default: logs 4xx)

## Example token exchange request

```bash
curl -X POST http://localhost:3050/tokens/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:token-exchange" \
  -d "subject_token=<google_id_token>" \
  -d "subject_token_type=urn:ietf:params:oauth:token-type:id_token" \
  -d "audience=https://api.stockcomp.local" \
  -d "scope=stock:read"
```

## DDD structure

- `src/domain/tokenExchange`: domain types, errors, ports
- `src/application/tokenExchange`: exchange use case
- `src/infrastructure/*`: concrete validators, registries, issuers, clock
- `src/interfaces/http/*`: Hono HTTP routes
- `src/composition/createApp.ts`: composition root

## Access token claim contract

For exchanged access tokens issued from Google ID tokens:

- `sub`: `google:<google_sub>` (stable external identity key)
- `iss`: token exchange server issuer (`ISSUER_BASE_URL`)
- `aud`: target resource server audience
- `exp` / `iat`: token expiry / issued-at timestamps
- `scope`: granted scopes (if requested)
- `act.sub`: same identity as `sub`
- `act.iss`: upstream token issuer (for Google: `https://accounts.google.com` or `accounts.google.com`)

Resource servers should use `sub` as the principal identifier and map it to local user records.

## Logging and tracing

- Every request gets a `requestId` (`x-request-id` in/out).
- Access logs include method, path, status, duration, and requestId.
- 5xx responses are always logged as errors.
- 4xx responses are logged as warnings by default; disable with `LOG_CLIENT_ERRORS=false`.

## Notes

- This is a skeleton intended for extension.
- Google token signature verification is intentionally left as future hardening work; current validator enforces JWT structure + issuer/audience/expiry checks.
