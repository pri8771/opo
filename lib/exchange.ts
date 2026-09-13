import { env } from 'cloudflare:workers';

type Runtime = { DB?: D1Database; OPO_OPERATOR_KEY?: string };
export function database(): D1Database {
  const db = (env as unknown as Runtime).DB;
  if (!db) throw new Error('Exchange storage unavailable');
  return db;
}
export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export async function hash(value: string): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function operator(request: Request): Promise<boolean> {
  const expected = (env as unknown as Runtime).OPO_OPERATOR_KEY;
  const supplied = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  return !!expected && expected.length >= 32 && !!supplied && await hash(expected) === await hash(supplied);
}
export async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new Error('Use application/json');
  if (!request.body) throw new Error('JSON body required');
  const reader = request.body.getReader(); let total = 0; const chunks: Uint8Array[] = [];
  while (true) { const {done, value} = await reader.read(); if (done) break; total += value.length;
    if (total > 8192) { await reader.cancel(); throw new Error('Maximum request size is 8192 bytes'); } chunks.push(value); }
  const joined = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.length; }
  const body = JSON.parse(new TextDecoder().decode(joined));
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error('JSON object required');
  return body;
}
export function bounded(value: unknown, name: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || [...value].length > max) throw new Error(`${name} must be 1–${max} characters`);
  return value.trim();
}
export const windowStart = () => new Date(Date.now() - 90 * 86400000).toISOString();
export async function measure(event: string, channel = 'unknown') {
  const day = new Date().toISOString().slice(0,10);
  await database().prepare('INSERT INTO metrics(id,day,event,channel,count) VALUES(?,?,?,?,1) ON CONFLICT(id) DO UPDATE SET count=count+1').bind(`${day}:${event}:${channel}`,day,event,channel).run();
}
export async function rateLimit(request: Request, db: D1Database): Promise<boolean> {
  const now = new Date().toISOString();
  // Cloudflare supplies this header at the edge. Local requests share a bucket.
  const address = request.headers.get('CF-Connecting-IP') || 'local';
  const bucket = `client:${now.slice(0, 13)}:${await hash(now.slice(0, 10) + address)}`;
  const global = `global:${now.slice(0, 10)}`;
  const client = await db.prepare('INSERT INTO rate_limits(bucket,count) VALUES(?,1) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket).first<{count:number}>();
  if (!client || client.count > 6) return false;
  // Rejected client traffic cannot consume the shared daily allowance.
  const shared = await db.prepare('INSERT INTO rate_limits(bucket,count) VALUES(?,1) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(global).first<{count:number}>();
  return !!shared && shared.count <= 200;
}
