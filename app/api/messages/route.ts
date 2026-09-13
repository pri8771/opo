import { bounded, database, hash, json, rateLimit, readBody, windowStart } from '../../../lib/exchange';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url); const parent = url.searchParams.get('parent_id');
    if (parent && !/^[a-zA-Z0-9_-]{1,80}$/.test(parent)) return json({error:'Invalid parent_id'},400);
    const db = database();
    const rows = parent
      ? await db.prepare('SELECT id,parent_id,name,actor_type,role,kind,body,created_at FROM messages WHERE (id=? OR parent_id=?) AND created_at>=? ORDER BY created_at ASC LIMIT 100').bind(parent,parent,windowStart()).all()
      : await db.prepare('SELECT id,parent_id,name,actor_type,role,kind,body,created_at FROM messages WHERE created_at>=? ORDER BY created_at DESC LIMIT 100').bind(windowStart()).all();
    return json({messages:rows.results, identity:'Visitor identity and agent status are self-reported. Owner trials are labeled separately.'});
  } catch { return json({error:'Message storage temporarily unavailable; try again later'},503); }
}
export async function POST(request: Request) {
  let data: Record<string,unknown>;
  try { data = await readBody(request); } catch(e) { return json({error:(e as Error).message},400); }
  try {
    const name = bounded(data.name,'name',60), body = bounded(data.body,'body',3000);
    const kind = data.kind || 'introduction', actor = data.actor_type || 'unknown';
    if (!['introduction','proposal','feedback','reply'].includes(String(kind)) || !['agent','human','unknown'].includes(String(actor))) return json({error:'Invalid kind or actor_type'},400);
    if (data.public !== true) return json({error:'Set public:true to acknowledge public storage'},400);
    const key = request.headers.get('Idempotency-Key');
    if (!key || !/^[a-zA-Z0-9_-]{16,100}$/.test(key)) return json({error:'Idempotency-Key must contain 16–100 letters, digits, underscores or hyphens'},400);
    const parent = data.parent_id || null;
    if (parent && (typeof parent !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(parent))) return json({error:'Invalid parent_id'},400);
    const db = database(), keyHash = await hash(key);
    const prior = await db.prepare('SELECT id,name,body,kind,actor_type,parent_id FROM messages WHERE idempotency_hash=?').bind(keyHash).first();
    if (prior) {
      if (prior.name!==name || prior.body!==body || prior.kind!==kind || prior.actor_type!==actor || prior.parent_id!==parent) return json({error:'Idempotency key already used for different content'},409);
      return json({id:prior.id, duplicate:true});
    }
    if (parent && !await db.prepare('SELECT id FROM messages WHERE id=? AND created_at>=?').bind(parent,windowStart()).first()) return json({error:'Parent message not found'},404);
    if (!await rateLimit(request,db)) return json({error:'Posting limit reached. Try again next hour.'},429);
    const id = crypto.randomUUID(), now = new Date().toISOString();
    await db.prepare('INSERT INTO messages(id,parent_id,name,actor_type,role,kind,body,created_at,idempotency_hash) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,parent,name,actor,'visitor',kind,body,now,keyHash).run();
    return json({id,created_at:now,public:true},201);
  } catch(e) { if ((e as Error).message.includes('must be')) return json({error:(e as Error).message},400); return json({error:'Message was not confirmed. Retry with the same Idempotency-Key.'},503); }
}
