import type {
	IssueAccessTokenRequest,
	ResourceServerTokenIssuer,
	ResourceServerTokenIssuerRegistry,
} from "@domain/tokenExchange/ports.ts";
import {
	ACCESS_TOKEN_TYPE,
	type IssuedAccessToken,
} from "@domain/tokenExchange/types.ts";
import type { LocalRsaKeyStore } from "@infrastructure/issuedTokens/jwt/localRsaKeyStore.ts";

const textEncoder = new TextEncoder();

function base64Url(input: Uint8Array | string): string {
	const bytes = typeof input === "string" ? textEncoder.encode(input) : input;
	return Buffer.from(bytes).toString("base64url");
}

export class LocalJwtAccessTokenIssuer implements ResourceServerTokenIssuer {
	constructor(
		private readonly audience: string,
		private readonly issuer: string,
		private readonly keyStore: LocalRsaKeyStore,
	) {}

	supportsAudience(audience: string): boolean {
		return this.audience === audience;
	}

	async issueAccessToken(
		request: IssueAccessTokenRequest,
	): Promise<IssuedAccessToken> {
		const expiresIn = request.resourceServer.accessTokenLifetimeSeconds;
		const now = Math.floor(request.now.getTime() / 1000);
		const exp = now + expiresIn;

		const keyMaterial = await this.keyStore.getSigningMaterial();
		const header = {
			alg: keyMaterial.algorithm,
			typ: "JWT",
			kid: keyMaterial.kid,
		};
		const payload = {
			iss: this.issuer,
			aud: request.resourceServer.audience,
			sub: request.subject.subject,
			iat: now,
			exp,
			scope: request.scope,
			act: {
				sub: request.subject.subject,
				iss: request.subject.issuer,
			},
		};

		const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
		const signature = await crypto.subtle.sign(
			"RSASSA-PKCS1-v1_5",
			keyMaterial.privateKey,
			textEncoder.encode(signingInput),
		);
		const accessToken = `${signingInput}.${base64Url(new Uint8Array(signature))}`;

		return {
			accessToken,
			tokenType: "Bearer",
			expiresIn,
			scope: request.scope,
			issuedTokenType: ACCESS_TOKEN_TYPE,
		};
	}
}

export class InMemoryResourceServerTokenIssuerRegistry
	implements ResourceServerTokenIssuerRegistry
{
	constructor(private readonly issuers: ResourceServerTokenIssuer[]) {}

	resolve(audience: string): ResourceServerTokenIssuer | undefined {
		return this.issuers.find((issuer) => issuer.supportsAudience(audience));
	}
}
