import type {
	ExchangeTokenCommand,
	IssuedAccessToken,
	ResourceServerProfile,
	SubjectPrincipal,
	TokenTypeIdentifier,
} from "./types.ts";

export interface Clock {
	now(): Date;
}

export interface IncomingTokenValidator {
	supports(tokenType: TokenTypeIdentifier): boolean;
	validate(
		subjectToken: string,
		command: ExchangeTokenCommand,
	): Promise<SubjectPrincipal>;
}

export interface IncomingTokenValidatorRegistry {
	resolve(tokenType: TokenTypeIdentifier): IncomingTokenValidator | undefined;
}

export interface ResourceServerRegistry {
	findByAudience(audience: string): ResourceServerProfile | undefined;
}

export type IssueAccessTokenRequest = {
	subject: SubjectPrincipal;
	resourceServer: ResourceServerProfile;
	scope?: string;
	now: Date;
};

export interface ResourceServerTokenIssuer {
	supportsAudience(audience: string): boolean;
	issueAccessToken(
		request: IssueAccessTokenRequest,
	): Promise<IssuedAccessToken>;
}

export interface ResourceServerTokenIssuerRegistry {
	resolve(audience: string): ResourceServerTokenIssuer | undefined;
}
