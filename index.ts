import { createServer } from "./routes/server.ts";

const server = createServer();

console.log(`Token-Exchange: Listening on ${server.url}`);
