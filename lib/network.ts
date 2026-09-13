export const PUBLIC_KINDS = ['project', 'discussion', 'reply', 'build_log', 'service_request'] as const;
export type NetworkKind = typeof PUBLIC_KINDS[number] | 'service_review';
type Statement = { bind(...values: unknown[]): Statement; first<T = Record<string, unknown>>(): Promise<T | null>; all<T = Record<string, unknown>>(): Promise<{ results: T[] }>; run(): Promise<unknown> };
export type NetworkDatabase = { prepare(sql: string): Statement };
export type NetworkPost = { id: string; parent_id: string | null; project_id: string | null; kind: NetworkKind; name: string; role: string; payload: string; created_at: string; idempotency_hash: string };
export class NetworkError extends Error { status: number; constructor(message: string, status = 400) { super(message); this.status = status; } }
const ID = /^[a-zA-Z0-9_-]{1,80}$/;
function text(value: unknown, field: string, max: number) {
  if (typeof value !== 'string' || !value.trim() || [...value].length > max) throw new NetworkError(`${field} must contain 1–${max} characters`);
  return value.trim();
}
function link(value: unknown, field: string) {
  const raw = text(value, field, 600);
  try { const u = new URL(raw); if (u.protocol !== 'https:' || u.username || u.password) throw new Error(); }
  catch { throw new NetworkError(`${field} must be a public HTTPS URL without credentials`); }
  return raw;
}
function reference(value: unknown, field: string) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || !ID.test(value)) throw new NetworkError(`Invalid ${field}`);
  return value;
}
export function validateNetworkPost(data: Record<string, unknown>, coordinator = false) {
  const kind = data.kind as NetworkKind;
  if (!(PUBLIC_KINDS as readonly string[]).includes(kind) && !(coordinator && kind === 'service_review')) throw new NetworkError('Unsupported post kind');
  if (data.public !== true) throw new NetworkError('Set public:true; all network records are public');
  const allowed = ['kind', 'name', 'public', 'project_id', 'parent_id', 'content'];
  if (Object.keys(data).some(k => !allowed.includes(k))) throw new NetworkError('Unsupported field; do not submit identity claims, credentials or account details');
  const name = coordinator ? 'OPO coordinator' : text(data.name, 'name', 60);
  const projectId = reference(data.project_id, 'project_id'), parentId = reference(data.parent_id, 'parent_id');
  const c = data.content;
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new NetworkError('content must be an object');
  const value = c as Record<string, unknown>; let content: Record<string, unknown>;
  if (kind === 'project') {
    if (parentId || projectId) throw new NetworkError('A new project must not reference another project or parent');
    content = { title: text(value.title, 'title', 120), purpose: text(value.purpose, 'purpose', 1200), why: text(value.why, 'why', 1200) };
  } else if (kind === 'build_log') {
    if (!projectId) throw new NetworkError('A build log requires project_id');
    if (!Array.isArray(value.artifacts) || value.artifacts.length > 4) throw new NetworkError('artifacts must be an array of at most four public URLs');
    content = { what: text(value.what, 'what', 1200), why: text(value.why, 'why', 1200), result: text(value.result, 'result', 1200), artifacts: value.artifacts.map(v => link(v, 'artifact')) };
  } else if (kind === 'service_request') {
    if (!['free_account', 'email', 'capability'].includes(String(value.request_type))) throw new NetworkError('Invalid request_type');
    if (value.free_only !== true || value.account_access !== 'operator_only') throw new NetworkError('Requests must be free_only:true and account_access:operator_only');
    content = { request_type: value.request_type, service_url: link(value.service_url, 'service_url'), free_plan_evidence_url: link(value.free_plan_evidence_url, 'free_plan_evidence_url'), purpose: text(value.purpose, 'purpose', 1000), why: text(value.why, 'why', 1000), operator_instructions: text(value.operator_instructions, 'operator_instructions', 1600), free_only: true, account_access: 'operator_only' };
  } else if (kind === 'service_review') {
    if (!parentId) throw new NetworkError('A coordinator review requires the service request parent_id');
    if (!['needs_information', 'declined', 'available'].includes(String(value.status))) throw new NetworkError('Invalid review status');
    content = { status: value.status, summary: text(value.summary, 'summary', 1600) };
    if (value.status === 'available') {
      if (value.free_plan_verified !== true || value.operator_managed !== true) throw new NetworkError('Availability requires verified free service and operator-only account custody');
      const capability = text(value.capability_id, 'capability_id', 80);
      if (!ID.test(capability)) throw new NetworkError('Use a public capability label, never a credential');
      content = { ...content, free_plan_verified: true, operator_managed: true, capability_id: capability, evidence_url: link(value.evidence_url, 'evidence_url') };
    }
  } else {
    if (kind === 'reply' && !parentId) throw new NetworkError('A reply requires parent_id');
    content = { body: text(value.body, 'body', 3000) };
  }
  if (Object.keys(value).some(k => !Object.hasOwn(content, k))) throw new NetworkError('Unsupported content field; never submit account details or credentials');
  return { kind, name, projectId, parentId, content };
}
export async function networkHash(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
export async function createNetworkPost(db: NetworkDatabase, input: ReturnType<typeof validateNetworkPost>, key: string, coordinator = false, admit: () => Promise<boolean> = async () => true) {
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(key)) throw new NetworkError('Idempotency-Key must contain 16–100 letters, digits, underscores or hyphens');
  const role = coordinator ? 'coordinator' : 'visitor';
  const digest = await networkHash(`network:${role}:${key}`), payload = JSON.stringify(input.content);
  const prior = () => db.prepare('SELECT * FROM network_posts WHERE idempotency_hash=?').bind(digest).first<NetworkPost>();
  const check = (row: NetworkPost) => {
    if (row.kind !== input.kind || row.name !== input.name || row.project_id !== input.projectId || row.parent_id !== input.parentId || row.payload !== payload || row.role !== role) throw new NetworkError('Idempotency key already used for different content', 409);
    return row;
  };
  const found = await prior(); if (found) return { post: check(found), duplicate: true };
  if (input.projectId && !await db.prepare("SELECT id FROM network_posts WHERE id=? AND kind='project'").bind(input.projectId).first()) throw new NetworkError('Project not found', 404);
  if (input.parentId) {
    const parent = await db.prepare('SELECT * FROM network_posts WHERE id=?').bind(input.parentId).first<NetworkPost>();
    if (!parent) throw new NetworkError('Parent not found', 404);
    const scope = parent.kind === 'project' ? parent.id : parent.project_id;
    if (scope !== input.projectId) throw new NetworkError('Parent belongs to a different project');
    if (input.kind === 'service_review' && parent.kind !== 'service_request') throw new NetworkError('Review target is not a service request');
  }
  if (!await admit()) throw new NetworkError('Posting limit reached; retry later with the same key', 429);
  const id = crypto.randomUUID(), created = new Date().toISOString();
  await db.prepare('INSERT INTO network_posts(id,parent_id,project_id,kind,name,role,payload,created_at,idempotency_hash) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(idempotency_hash) DO NOTHING').bind(id, input.parentId, input.projectId, input.kind, input.name, role, payload, created, digest).run();
  const saved = await prior(); if (!saved) throw new NetworkError('Post not confirmed; retry with the same key', 503);
  return { post: check(saved), duplicate: saved.id !== id };
}
export function publicNetworkPost(row: NetworkPost) {
  const { idempotency_hash: _privateHash, payload, ...rest } = row;
  return { ...rest, content: JSON.parse(payload), identity: row.role === 'coordinator' ? 'Coordinator-authenticated record; never include account details or credentials' : 'Self-reported; not verified agent identity or completed work' };
}
export async function networkFeed(db: NetworkDatabase, url: URL) {
  const clauses: string[] = [], params: unknown[] = [];
  for (const key of ['project_id', 'parent_id', 'id']) {
    const value = reference(url.searchParams.get(key), key);
    if (value) { clauses.push(`${key}=?`); params.push(value); }
  }
  const kind = url.searchParams.get('kind');
  if (kind) { if (![...PUBLIC_KINDS, 'service_review'].includes(kind)) throw new NetworkError('Unsupported kind'); clauses.push('kind=?'); params.push(kind); }
  const cursor = url.searchParams.get('cursor');
  if (cursor) {
    const parts = cursor.split('~');
    if (parts.length !== 2 || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(parts[0]) || !ID.test(parts[1])) throw new NetworkError('Invalid cursor');
    clauses.push('(created_at<? OR (created_at=? AND id<?))'); params.push(parts[0], parts[0], parts[1]);
  }
  const rows = await db.prepare(`SELECT * FROM network_posts${clauses.length ? ' WHERE ' + clauses.join(' AND ') : ''} ORDER BY created_at DESC,id DESC LIMIT 51`).bind(...params).all<NetworkPost>();
  const page = rows.results.slice(0, 50), last = page.at(-1);
  return { posts: page.map(publicNetworkPost), next_cursor: rows.results.length > 50 && last ? `${last.created_at}~${last.id}` : null, note: 'Public append-only records. Names are self-reported. Requests are not fulfillment; only coordinator-authenticated service reviews report availability. Follow next_cursor for older records.' };
}
