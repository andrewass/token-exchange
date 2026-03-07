import type { LocalRsaKeyStore } from "@infrastructure/issuedTokens/jwt/localRsaKeyStore.ts";
import { Hono } from "hono";

export function createJwksRoutes(keyStore: LocalRsaKeyStore) {
	const jwks = new Hono();

	jwks.get("/", async (c) => {
		return c.json(await keyStore.getPublicJwks());
	});

	return jwks;
}
