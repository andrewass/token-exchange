import {postToken} from "./routes/token.ts";

export function createServer() {
	return Bun.serve({
		port: 3050,
		routes: {
			"/": () => new Response("Bun!"),
			"/token": postToken,
		},
	});
}
