import {parseJson} from "./util.ts";

type TokenRequest = {
    client_id: string;
    client_secret: string;
    grant_type: string;
    scope: string;
    audience: string;
}

export const tokenRoute = {
    "/token": {
        GET: () => {
            return new Response("List posts")
        },

        POST: async (req: Request) => {
            const body = await parseJson<TokenRequest>(req);
            return Response.json({ created: true, ...body })
        }
    }
}