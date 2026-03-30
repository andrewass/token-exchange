import { ExchangeTokenUseCase } from "@application/tokenExchange/exchangeTokenUseCase.ts";
import { GoogleIdTokenValidator } from "@infrastructure/incomingTokens/google/googleIdTokenValidator.ts";
import { InMemoryIncomingTokenValidatorRegistry } from "@infrastructure/incomingTokens/registry/incomingTokenValidatorRegistry.ts";
import {
	InMemoryResourceServerTokenIssuerRegistry,
	LocalJwtAccessTokenIssuer,
} from "@infrastructure/issuedTokens/jwt/localJwtTokenIssuer.ts";
import { LocalRsaKeyStore } from "@infrastructure/issuedTokens/jwt/localRsaKeyStore.ts";
import { logger } from "@infrastructure/observability/appLogger.ts";
import { InMemoryResourceServerRegistry } from "@infrastructure/resourceServers/inMemoryResourceServerRegistry.ts";
import { SystemClock } from "@infrastructure/time/systemClock.ts";
import { createDiscoveryRoutes } from "@interfaces/http/discovery/discoveryRoutes.ts";
import type { AppBindings } from "@interfaces/http/httpContext.ts";
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

function readRequiredCsvEnv(name: string): string[] {
	const values = readCsvEnv(name, []);
	if (values.length === 0) {
		throw new Error(`${name} is not set or has no values`);
	}
	return values;
}

function shouldLogClientErrors(): boolean {
	return process.env.LOG_CLIENT_ERRORS !== "false";
}

function toErrorContext(error: unknown): Record<string, unknown> {
	if (error instanceof Error) {
		return {
			type: error.name,
			message: error.message,
			stack: error.stack,
		};
	}
	return {
		type: "UnknownError",
		message: String(error),
	};
}

export function createApp() {
	const app = new Hono<AppBindings>();
	const logClientErrors = shouldLogClientErrors();

	app.use("*", async (c, next) => {
		const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
		const startedAt = performance.now();
		c.set("requestId", requestId);

		try {
			await next();
		} finally {
			const status = c.res.status || 500;
			const durationMs = Number((performance.now() - startedAt).toFixed(2));
			c.header("x-request-id", requestId);

			const event = {
				requestId,
				method: c.req.method,
				path: c.req.path,
				status,
				durationMs,
			};

			if (status >= 500) {
				logger.error("Request failed", event);
			} else if (status >= 400) {
				if (logClientErrors) {
					logger.warn("Request rejected", event);
				}
			} else {
				logger.info("Request served", event);
			}
		}
	});

	const issuerBaseUrl =
		process.env.ISSUER_BASE_URL ??
		(() => {
			throw new Error("ISSUER_BASE_URL is not set");
		})();
	const stockcompAudience =
		process.env.STOCKCOMP_AUDIENCE ??
		(() => {
			throw new Error("STOCKCOMP_AUDIENCE is not set");
		})();

	const keyStore = new LocalRsaKeyStore();

	const incomingTokenValidators = new InMemoryIncomingTokenValidatorRegistry([
		new GoogleIdTokenValidator({
			allowedAudiences: readRequiredCsvEnv("GOOGLE_ALLOWED_AUDIENCES"),
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

	app.route("/token", createTokenRoutes(tokenExchange));
	app.route("/jwks", createJwksRoutes(keyStore));
	app.route("/.well-known", createDiscoveryRoutes({ issuerBaseUrl }));

	app.notFound((c) => {
		if (logClientErrors) {
			logger.warn("Route not found", {
				requestId: c.get("requestId"),
				path: c.req.path,
				method: c.req.method,
			});
		}
		return c.json(
			{
				error: "not_found",
				error_description: "Resource not found.",
			},
			404,
		);
	});

	app.onError((error, c) => {
		logger.error("Unhandled request exception", {
			requestId: c.get("requestId"),
			path: c.req.path,
			method: c.req.method,
			error: toErrorContext(error),
		});
		return c.json({ error: "server_error" }, 500);
	});

	app.get("/", (c) =>
		c.json({
			service: "token-exchange",
			grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
			token_endpoint: `${issuerBaseUrl}/token`,
		}),
	);

	return app;
}
