export const TOKEN_EXCHANGE_GRANT_TYPE =
	"urn:ietf:params:oauth:grant-type:token-exchange";

export const ACCESS_TOKEN_TYPE =
	"urn:ietf:params:oauth:token-type:access_token";
export const ID_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:id_token";

export type TokenTypeIdentifier = string;

export type ExchangeTokenCommand = {
	grantType: string;
	subjectToken: string;
	subjectTokenType: TokenTypeIdentifier;
	audience?: string;
	resource?: string;
	scope?: string;
	requestedTokenType?: TokenTypeIdentifier;
};

export type SubjectPrincipal = {
	subject: string;
	issuer: string;
	tokenType: TokenTypeIdentifier;
	claims: Record<string, unknown>;
	authenticatedAt: Date;
};

export type ResourceServerProfile = {
	audience: string;
	issuer: string;
	allowedScopes: string[];
	accessTokenLifetimeSeconds: number;
};

export type IssuedAccessToken = {
	accessToken: string;
	tokenType: "Bearer";
	expiresIn: number;
	scope?: string;
	issuedTokenType: TokenTypeIdentifier;
};

export type TokenExchangeResult = IssuedAccessToken;
