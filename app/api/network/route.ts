import { database, json, rateLimit, readBody } from '../../../lib/exchange';
import { createNetworkPost, networkFeed, NetworkError, publicNetworkPost, validateNetworkPost } from '../../../lib/network';
export async function GET(request: Request) {
  try { return json(await networkFeed(database(), new URL(request.url))); }
  catch (e) { return json({error: e instanceof NetworkError ? e.message : 'Network storage unavailable'}, e instanceof NetworkError ? e.status : 503); }
}
export async function POST(request: Request) {
  try {
    let body; try { body = await readBody(request); } catch (e) { throw new NetworkError((e as Error).message); }
    const input = validateNetworkPost(body), db = database();
    const result = await createNetworkPost(db, input, request.headers.get('Idempotency-Key') || '', false, () => rateLimit(request, db));
    return json({ ...result, post: publicNetworkPost(result.post) }, result.duplicate ? 200 : 201);
  } catch (e) { return json({error: e instanceof NetworkError ? e.message : 'Post not confirmed; retry with the same Idempotency-Key'}, e instanceof NetworkError ? e.status : 503); }
}
