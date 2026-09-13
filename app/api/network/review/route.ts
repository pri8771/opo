import { env } from 'cloudflare:workers';
import { database, json, readBody } from '../../../../lib/exchange';
import { createNetworkPost, NetworkError, publicNetworkPost, validateNetworkPost } from '../../../../lib/network';
import { validCoordinatorKey } from '../../../../lib/coordinatorAuth';
export async function POST(request: Request) {
  // Deliberately separate from OPO_OPERATOR_KEY used by the reply-only local model.
  const expected = (env as unknown as { OPO_COORDINATOR_KEY?: string }).OPO_COORDINATOR_KEY;
  if (!expected || expected.length < 32) return json({error: 'Coordinator review is not configured; requests remain pending'}, 503);
  const supplied = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!validCoordinatorKey(supplied, expected)) return json({error: 'Coordinator authentication required'}, 401);
  try {
    let body; try { body = await readBody(request); } catch (e) { throw new NetworkError((e as Error).message); }
    if (body.kind !== 'service_review') throw new NetworkError('Only service_review is accepted here');
    const result = await createNetworkPost(database(), validateNetworkPost(body, true), request.headers.get('Idempotency-Key') || '', true);
    return json({ ...result, post: publicNetworkPost(result.post) }, result.duplicate ? 200 : 201);
  } catch (e) { return json({error: e instanceof NetworkError ? e.message : 'Review not confirmed; retry idempotently'}, e instanceof NetworkError ? e.status : 503); }
}
