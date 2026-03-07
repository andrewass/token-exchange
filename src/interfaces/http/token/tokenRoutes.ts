import type { ExchangeTokenUseCase } from "@application/tokenExchange/exchangeTokenUseCase.ts";
import { OAuthTokenExchangeError } from "@domain/tokenExchange/errors.ts";
import {
	type ExchangeTokenCommand,
	TOKEN_EXCHANGE_GRANT_TYPE,
} from "@domain/tokenExchange/types.ts";
import { Hono } from "hono";

function first(
	body: Record<string, string | File | (string | File)[] | undefined>,
	key: string,
): string | undefined {
	const value = body[key];
	if (Array.isArray(value)) {
		const firstValue = value[0];
		return typeof firstValue === "string" ? firstValue : undefined;
	}
	return typeof value === "string" ? value : undefined;
}

function toCommand(
	body: Record<string, string | File | (string | File)[] | undefined>,
): ExchangeTokenCommand {
	return {
		grantType: first(body, "grant_type") ?? "",
		subjectToken: first(body, "subject_token") ?? "",
		subjectTokenType: first(body, "subject_token_type") ?? "",
		audience: first(body, "audience"),
		resource: first(body, "resource"),
		scope: first(body, "scope"),
		requestedTokenType: first(body, "requested_token_type"),
	};
}

function oauthStatus(status: number): 400 | 401 | 403 | 500 {
	if (status === 401 || status === 403 || status === 500) {
		return status;
	}
	return 400;
}

export function createTokenRoutes(exchangeTokenUseCase: ExchangeTokenUseCase) {
	const tokens = new Hono();

	tokens.post("/exchange", async (c) => {
		try {
			const body = await c.req.parseBody();
			const command = toCommand(body);
			const response = await exchangeTokenUseCase.execute(command);
			return c.json(response);
		} catch (error) {
			if (error instanceof OAuthTokenExchangeError) {
				return c.json(error.toOAuthBody(), oauthStatus(error.status));
			}
			return c.json({ error: "server_error" }, 500);
		}
	});

	tokens.post("/token", async (c) => {
		const body = await c.req.parseBody();
		if (first(body, "grant_type") !== TOKEN_EXCHANGE_GRANT_TYPE) {
			return c.json(
				{
					error: "unsupported_grant_type",
					error_description: `grant_type must be ${TOKEN_EXCHANGE_GRANT_TYPE}`,
				},
				400,
			);
		}

		try {
			const command = toCommand(body);
			const response = await exchangeTokenUseCase.execute(command);
			return c.json(response);
		} catch (error) {
			if (error instanceof OAuthTokenExchangeError) {
				return c.json(error.toOAuthBody(), oauthStatus(error.status));
			}
			return c.json({ error: "server_error" }, 500);
		}
	});

	return tokens;
}
