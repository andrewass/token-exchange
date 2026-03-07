type PublicJwk = Record<string, unknown>;

type SigningMaterial = {
	kid: string;
	algorithm: "RS256";
	privateKey: CryptoKey;
	publicJwk: PublicJwk;
};

export class LocalRsaKeyStore {
	private materialPromise: Promise<SigningMaterial> | undefined;

	async getSigningMaterial(): Promise<SigningMaterial> {
		if (!this.materialPromise) {
			this.materialPromise = this.generate();
		}
		return this.materialPromise;
	}

	async getPublicJwks(): Promise<{ keys: PublicJwk[] }> {
		const material = await this.getSigningMaterial();
		return {
			keys: [
				{
					...material.publicJwk,
					kid: material.kid,
					alg: material.algorithm,
					use: "sig",
				},
			],
		};
	}

	private async generate(): Promise<SigningMaterial> {
		const pair = await crypto.subtle.generateKey(
			{
				name: "RSASSA-PKCS1-v1_5",
				modulusLength: 2048,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: "SHA-256",
			},
			true,
			["sign", "verify"],
		);

		const publicJwk = (await crypto.subtle.exportKey(
			"jwk",
			pair.publicKey,
		)) as PublicJwk;
		const kid = crypto.randomUUID();

		return {
			kid,
			algorithm: "RS256",
			privateKey: pair.privateKey,
			publicJwk,
		};
	}
}
