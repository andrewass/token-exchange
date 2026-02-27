import { Hono } from "hono";

const jwks = new Hono();

jwks.get("/", (c) => c.text("Hello Jwks!"));

export default jwks;
