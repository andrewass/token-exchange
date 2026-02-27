import { Hono } from "hono";
import jwks from "./jwks/jwksRoutes.ts";
import tokens from "./token/tokenRoutes.ts";

const app = new Hono();

app.route("/tokens", tokens);
app.route("/jwks", jwks);

app.get("/", (c) => c.text("Hello Bun!"));

export default {
	fetch: app.fetch,
	port: 3050,
};
