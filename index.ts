const server = Bun.serve({
    port: 3050,
    routes: {
        "/": () => new Response('Bun!'),
    }
});

console.log(`Listening on ${server.url}`);