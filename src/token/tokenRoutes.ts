import { Hono } from "hono";

const tokens = new Hono();

tokens.get("/", (c) => c.text("Hello Token!"));

export default tokens;
