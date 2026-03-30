import { Hono } from "hono";

type DiscoveryOptions = {
	issuerBaseUrl: string;
};

export function createDiscoveryRoutes(options: DiscoveryOptions) {
	const discovery = new Hono();

	discovery.get("/oauth-authorization-server", (c) => {
		return c.json({
			issuer: options.issuerBaseUrl,
			token_endpoint: `${options.issuerBaseUrl}/token`,
			jwks_uri: `${options.issuerBaseUrl}/jwks`,
			grant_types_supported: [
				"urn:ietf:params:oauth:grant-type:token-exchange",
			],
			subject_token_types_supported: [
				"urn:ietf:params:oauth:token-type:id_token",
			],
			requested_token_types_supported: [
				"urn:ietf:params:oauth:token-type:access_token",
			],
		});
	});

	return discovery;
}
