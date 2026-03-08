import type { ExchangeTokenUseCase } from "@application/tokenExchange/exchangeTokenUseCase.ts";
import { OAuthTokenExchangeError } from "@domain/tokenExchange/errors.ts";
import {
	type ExchangeTokenCommand,
	TOKEN_EXCHANGE_GRANT_TYPE,
} from "@domain/tokenExchange/types.ts";
import { logger } from "@infrastructure/observability/appLogger.ts";
import type { AppBindings } from "@interfaces/http/httpContext.ts";
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

function toOAuthErrorContext(
	error: OAuthTokenExchangeError,
	status: number,
): Record<string, unknown> {
	return {
		type: "OAuthTokenExchangeError",
		code: error.error,
		message: error.message,
		description: error.errorDescription,
		status,
	};
}

export function createTokenRoutes(exchangeTokenUseCase: ExchangeTokenUseCase) {
	const tokens = new Hono<AppBindings>();
	const logClientErrors = shouldLogClientErrors();

	tokens.post("/", async (c) => {
		const requestId = c.get("requestId");
		let body: Record<string, string | File | (string | File)[] | undefined>;

		try {
			body = await c.req.parseBody();
		} catch (error) {
			logger.warn("Invalid token request body", {
				requestId,
				path: c.req.path,
				error: toErrorContext(error),
			});
			return c.json(
				{
					error: "invalid_request",
					error_description: "Request body must be a valid form payload.",
				},
				400,
			);
		}

		if (first(body, "grant_type") !== TOKEN_EXCHANGE_GRANT_TYPE) {
			if (logClientErrors) {
				logger.warn("Unsupported grant_type", {
					requestId,
					path: c.req.path,
					error: {
						type: "OAuthTokenExchangeError",
						code: "unsupported_grant_type",
						message: "Unsupported grant_type",
						description: `grant_type must be ${TOKEN_EXCHANGE_GRANT_TYPE}`,
						status: 400,
					},
					grantType: first(body, "grant_type"),
				});
			}
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
			logger.info("Token exchange succeeded", {
				requestId,
				path: c.req.path,
				audience: command.audience,
				subjectTokenType: command.subjectTokenType,
			});
			return c.json(response);
		} catch (error) {
			if (error instanceof OAuthTokenExchangeError) {
				const status = oauthStatus(error.status);
				if (status >= 500 || logClientErrors) {
					const logFn =
						status >= 500
							? logger.error.bind(logger)
							: logger.warn.bind(logger);
					logFn("Token exchange rejected", {
						requestId,
						path: c.req.path,
						error: toOAuthErrorContext(error, status),
					});
				}
				return c.json(error.toOAuthBody(), status);
			}

			logger.error("Unhandled token exchange exception", {
				requestId,
				path: c.req.path,
				error: toErrorContext(error),
			});
			return c.json({ error: "server_error" }, 500);
		}
	});

	return tokens;
}
