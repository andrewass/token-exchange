import { OAuthTokenExchangeError } from "@domain/tokenExchange/errors.ts";
import type {
	Clock,
	IncomingTokenValidatorRegistry,
	ResourceServerRegistry,
	ResourceServerTokenIssuerRegistry,
} from "@domain/tokenExchange/ports.ts";
import {
	ACCESS_TOKEN_TYPE,
	type ExchangeTokenCommand,
	TOKEN_EXCHANGE_GRANT_TYPE,
	type TokenExchangeResult,
} from "@domain/tokenExchange/types.ts";

export class ExchangeTokenUseCase {
	constructor(
		private readonly validators: IncomingTokenValidatorRegistry,
		private readonly resourceServers: ResourceServerRegistry,
		private readonly tokenIssuers: ResourceServerTokenIssuerRegistry,
		private readonly clock: Clock,
	) {}

	async execute(command: ExchangeTokenCommand): Promise<TokenExchangeResult> {
		this.validateCommand(command);

		const validator = this.validators.resolve(command.subjectTokenType);
		if (!validator) {
			throw new OAuthTokenExchangeError(
				"unsupported_subject_token_type",
				400,
				"No validator available for subject_token_type",
				"The given subject_token_type is not supported by this server.",
			);
		}

		const audience = this.resolveAudience(command);
		const resourceServer = this.resourceServers.findByAudience(audience);
		if (!resourceServer) {
			throw new OAuthTokenExchangeError(
				"invalid_target",
				400,
				"Unknown target audience",
				"The requested audience/resource is not configured.",
			);
		}

		const tokenIssuer = this.tokenIssuers.resolve(resourceServer.audience);
		if (!tokenIssuer) {
			throw new OAuthTokenExchangeError(
				"server_error",
				500,
				"No token issuer configured for target audience",
			);
		}

		const subject = await validator.validate(command.subjectToken, command);
		const scope = this.filterScope(command.scope, resourceServer.allowedScopes);

		return tokenIssuer.issueAccessToken({
			subject,
			resourceServer,
			scope,
			now: this.clock.now(),
		});
	}

	private validateCommand(command: ExchangeTokenCommand): void {
		if (command.grantType !== TOKEN_EXCHANGE_GRANT_TYPE) {
			throw new OAuthTokenExchangeError(
				"unsupported_grant_type",
				400,
				"Unsupported grant_type",
				`grant_type must be ${TOKEN_EXCHANGE_GRANT_TYPE}`,
			);
		}

		if (!command.subjectToken || !command.subjectTokenType) {
			throw new OAuthTokenExchangeError(
				"invalid_request",
				400,
				"Missing subject token parameters",
				"subject_token and subject_token_type are required.",
			);
		}

		const requestedType = command.requestedTokenType ?? ACCESS_TOKEN_TYPE;
		if (requestedType !== ACCESS_TOKEN_TYPE) {
			throw new OAuthTokenExchangeError(
				"invalid_request",
				400,
				"Unsupported requested_token_type",
				"Only access_token output is currently supported.",
			);
		}
	}

	private resolveAudience(command: ExchangeTokenCommand): string {
		const audience = command.audience ?? command.resource;
		if (!audience) {
			throw new OAuthTokenExchangeError(
				"invalid_target",
				400,
				"Missing target",
				"audience or resource must be supplied.",
			);
		}
		return audience;
	}

	private filterScope(
		requestedScope: string | undefined,
		allowedScopes: string[],
	): string | undefined {
		if (!requestedScope) {
			return undefined;
		}

		const requested = requestedScope.split(/\s+/).filter(Boolean);
		const allowed = requested.filter((scope) => allowedScopes.includes(scope));
		return allowed.length > 0 ? allowed.join(" ") : undefined;
	}
}
