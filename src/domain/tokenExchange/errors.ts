export type OAuthErrorCode =
	| "invalid_request"
	| "invalid_grant"
	| "invalid_target"
	| "invalid_client"
	| "unauthorized_client"
	| "unsupported_grant_type"
	| "unsupported_subject_token_type"
	| "server_error";

export class OAuthTokenExchangeError extends Error {
	readonly error: OAuthErrorCode;
	readonly status: number;
	readonly errorDescription?: string;

	constructor(
		error: OAuthErrorCode,
		status: number,
		message: string,
		errorDescription?: string,
	) {
		super(message);
		this.error = error;
		this.status = status;
		this.errorDescription = errorDescription;
	}

	toOAuthBody(): { error: OAuthErrorCode; error_description?: string } {
		return {
			error: this.error,
			error_description: this.errorDescription,
		};
	}
}
