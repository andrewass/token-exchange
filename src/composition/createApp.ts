import { ExchangeTokenUseCase } from "@application/tokenExchange/exchangeTokenUseCase.ts";
import { GoogleIdTokenValidator } from "@infrastructure/incomingTokens/google/googleIdTokenValidator.ts";
import { InMemoryIncomingTokenValidatorRegistry } from "@infrastructure/incomingTokens/registry/incomingTokenValidatorRegistry.ts";
import {
	InMemoryResourceServerTokenIssuerRegistry,
	LocalJwtAccessTokenIssuer,
} from "@infrastructure/issuedTokens/jwt/localJwtTokenIssuer.ts";
import { LocalRsaKeyStore } from "@infrastructure/issuedTokens/jwt/localRsaKeyStore.ts";
import { InMemoryResourceServerRegistry } from "@infrastructure/resourceServers/inMemoryResourceServerRegistry.ts";
import { SystemClock } from "@infrastructure/time/systemClock.ts";
import { createDiscoveryRoutes } from "@interfaces/http/discovery/discoveryRoutes.ts";
import { createJwksRoutes } from "@interfaces/http/jwks/jwksRoutes.ts";
import { createTokenRoutes } from "@interfaces/http/token/tokenRoutes.ts";
import { Hono } from "hono";

function readCsvEnv(name: string, fallback: string[]): string[] {
	const raw = process.env[name];
	if (!raw) {
		return fallback;
	}
	return raw
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
}

export function createApp() {
	const app = new Hono();

	const issuerBaseUrl = process.env.ISSUER_BASE_URL ?? "http://localhost:3050";
	const stockcompAudience =
		process.env.STOCKCOMP_AUDIENCE ?? "https://api.stockcomp.local";

	const keyStore = new LocalRsaKeyStore();

	const incomingTokenValidators = new InMemoryIncomingTokenValidatorRegistry([
		new GoogleIdTokenValidator({
			allowedAudiences: readCsvEnv("GOOGLE_ALLOWED_AUDIENCES", [
				"google-client-id-placeholder",
			]),
			allowedIssuers: ["https://accounts.google.com", "accounts.google.com"],
		}),
	]);

	const resourceServers = new InMemoryResourceServerRegistry([
		{
			audience: stockcompAudience,
			issuer: issuerBaseUrl,
			allowedScopes: ["stock:read", "stock:trade", "portfolio:read"],
			accessTokenLifetimeSeconds: 900,
		},
	]);

	const tokenIssuers = new InMemoryResourceServerTokenIssuerRegistry([
		new LocalJwtAccessTokenIssuer(stockcompAudience, issuerBaseUrl, keyStore),
	]);

	const tokenExchange = new ExchangeTokenUseCase(
		incomingTokenValidators,
		resourceServers,
		tokenIssuers,
		new SystemClock(),
	);

	app.route("/tokens", createTokenRoutes(tokenExchange));
	app.route("/jwks", createJwksRoutes(keyStore));
	app.route("/.well-known", createDiscoveryRoutes({ issuerBaseUrl }));

	app.get("/", (c) =>
		c.json({
			service: "token-exchange",
			grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
			token_endpoint: `${issuerBaseUrl}/tokens/token`,
		}),
	);

	return app;
}
