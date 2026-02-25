
export async function parseJson<T>(req: Request): Promise<T> {
    return (await req.json()) as T
}