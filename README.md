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
- `POST /tokens/exchange` (alias endpoint)
- `GET /jwks` (public keys for issued access tokens)
- `GET /.well-known/oauth-authorization-server` (metadata)

## Environment variables

- `ISSUER_BASE_URL` (default: `http://localhost:3050`)
- `GOOGLE_ALLOWED_AUDIENCES` comma-separated allowed Google client IDs
- `STOCKCOMP_AUDIENCE` (default: `https://api.stockcomp.local`)

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

## Notes

- This is a skeleton intended for extension.
- Google token signature verification is intentionally left as future hardening work; current validator enforces JWT structure + issuer/audience/expiry checks.
