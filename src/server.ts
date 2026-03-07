import { createApp } from "@composition/createApp.ts";

const app = createApp();

export default {
	fetch: app.fetch,
	port: 3050,
};
