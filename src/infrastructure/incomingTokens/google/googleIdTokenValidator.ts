import { OAuthTokenExchangeError } from "@domain/tokenExchange/errors.ts";
import type { IncomingTokenValidator } from "@domain/tokenExchange/ports.ts";
import {
	type ExchangeTokenCommand,
	ID_TOKEN_TYPE,
} from "@domain/tokenExchange/types.ts";

type JwtPayload = {
	sub?: string;
	iss?: string;
	aud?: string | string[];
	exp?: number;
	iat?: number;
	email?: string;
	[key: string]: unknown;
};

export type GoogleIdTokenValidatorConfig = {
	allowedAudiences: string[];
	allowedIssuers: string[];
};

export class GoogleIdTokenValidator implements IncomingTokenValidator {
	constructor(private readonly config: GoogleIdTokenValidatorConfig) {}

	supports(tokenType: string): boolean {
		return tokenType === ID_TOKEN_TYPE;
	}

	async validate(subjectToken: string, _command: ExchangeTokenCommand) {
		const payload = this.decodeJwtPayload(subjectToken);

		this.validateIssuer(payload.iss);
		this.validateAudience(payload.aud);
		this.validateExpiry(payload.exp);

		if (!payload.sub) {
			throw new OAuthTokenExchangeError(
				"invalid_grant",
				400,
				"Google ID token is missing sub",
			);
		}

		return {
			subject: payload.sub,
			issuer: String(payload.iss),
			tokenType: ID_TOKEN_TYPE,
			claims: payload,
			authenticatedAt: payload.iat ? new Date(payload.iat * 1000) : new Date(),
		};
	}

	private decodeJwtPayload(token: string): JwtPayload {
		const segments = token.split(".");
		if (segments.length !== 3) {
			throw new OAuthTokenExchangeError(
				"invalid_grant",
				400,
				"subject_token must be a JWT",
			);
		}

		const payloadSegment = segments[1];
		if (!payloadSegment) {
			throw new OAuthTokenExchangeError(
				"invalid_grant",
				400,
				"Invalid JWT payload segment",
			);
		}

		try {
			const payloadJson = Buffer.from(payloadSegment, "base64url").toString(
				"utf-8",
			);
			return JSON.parse(payloadJson) as JwtPayload;
		} catch {
			throw new OAuthTokenExchangeError(
				"invalid_grant",
				400,
				"Invalid JWT payload",
			);
		}
	}

	private validateIssuer(iss: string | undefined): void {
		if (!iss || !this.config.allowedIssuers.includes(iss)) {
			throw new OAuthTokenExchangeError(
				"invalid_grant",
				400,
				"subject_token issuer is not accepted",
			);
		}
	}

	private validateAudience(aud: string | string[] | undefined): void {
		if (!aud) {
			throw new OAuthTokenExchangeError(
				"invalid_grant",
				400,
				"subject_token audience is missing",
			);
		}

		const audiences = Array.isArray(aud) ? aud : [aud];
		const allowed = audiences.some((value) =>
			this.config.allowedAudiences.includes(value),
		);

		if (!allowed) {
			throw new OAuthTokenExchangeError(
				"invalid_grant",
				400,
				"subject_token audience is not accepted",
			);
		}
	}

	private validateExpiry(exp: number | undefined): void {
		if (!exp) {
			throw new OAuthTokenExchangeError(
				"invalid_grant",
				400,
				"subject_token is missing exp",
			);
		}

		if (exp * 1000 <= Date.now()) {
			throw new OAuthTokenExchangeError(
				"invalid_grant",
				400,
				"subject_token has expired",
			);
		}
	}
}
