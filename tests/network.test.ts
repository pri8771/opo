import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createNetworkPost, networkFeed, publicNetworkPost, validateNetworkPost } from '../lib/network.ts';
import type { NetworkDatabase } from '../lib/network.ts';
import { validCoordinatorKey } from '../lib/coordinatorAuth.ts';

test('coordinator key requires configured strong secret and rejects other worker keys and missing credentials', () => {
  const coordinator = 'coordinator-test-fixture-key-1234567890';
  assert.equal(validCoordinatorKey(coordinator, coordinator), true);
  for (const invalid of [undefined, '', 'reply-only-worker-test-key-1234567890', coordinator + 'x', coordinator.slice(1)]) assert.equal(validCoordinatorKey(invalid, coordinator), false);
  assert.equal(validCoordinatorKey(coordinator, undefined), false);
  assert.equal(validCoordinatorKey('short', 'short'), false);
});

function database(t: { after(fn: () => void): void }): NetworkDatabase {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync('drizzle/0002_optimal_tinkerer.sql', 'utf8'));
  t.after(() => sql.close());
  return { prepare(query: string) {
    let values: any[] = [];
    return {
      bind(...args: any[]) { values = args; return this; },
      async first<T>() { return (sql.prepare(query).get(...values) || null) as T | null; },
      async all<T>() { return { results: sql.prepare(query).all(...values) as T[] }; },
      async run() { return sql.prepare(query).run(...values); },
    };
  } };
}
const project = (title = 'A shared agent notebook') => ({ kind: 'project', name: 'test-agent', public: true, content: { title, purpose: 'Share useful work', why: 'Make contributions reusable' } });
const service = () => ({ kind: 'service_request', name: 'test-agent', public: true, content: { request_type: 'free_account', service_url: 'https://example.com/', free_plan_evidence_url: 'https://example.com/free', purpose: 'Host public project notes', why: 'Share results', operator_instructions: 'Review the free plan and publish approved notes', free_only: true, account_access: 'operator_only' } });
const key = (n: number) => `network-test-key-${n}`;

test('real migration supports projects, durable build logs and replies with project-scoped threads', async t => {
  const db = database(t);
  const p = await createNetworkPost(db, validateNetworkPost(project()), key(1));
  const log = await createNetworkPost(db, validateNetworkPost({ kind: 'build_log', name: 'builder', public: true, project_id: p.post.id, content: { what: 'Added an example', why: 'Explain the protocol', result: 'Local example verified; not deployed', artifacts: ['https://example.com/result'] } }), key(2));
  await createNetworkPost(db, validateNetworkPost({ kind: 'reply', name: 'reviewer', public: true, project_id: p.post.id, parent_id: log.post.id, content: { body: 'Please add a failure example.' } }), key(3));
  const feed = await networkFeed(db, new URL(`https://example.com/api/network?project_id=${p.post.id}`));
  assert.equal(feed.posts.length, 2);
  assert.equal(feed.posts.find(v => v.kind === 'build_log')?.content.why, 'Explain the protocol');
  assert.equal('idempotency_hash' in publicNetworkPost(log.post), false);
  await db.prepare('UPDATE network_posts SET created_at=? WHERE id=?').bind('2020-01-01T00:00:00.000Z', log.post.id).run();
  assert.equal((await networkFeed(db, new URL('https://example.com/api/network?kind=build_log'))).posts.length, 1);
});

test('build logs require what, why and observed result; arbitrary privilege and credential fields are rejected', () => {
  for (const omitted of ['what', 'why', 'result']) {
    const content: Record<string, unknown> = { what: 'Change', why: 'Reason', result: 'Observed result', artifacts: [] };
    delete content[omitted];
    assert.throws(() => validateNetworkPost({ kind: 'build_log', name: 'agent', public: true, project_id: 'p1', content }), new RegExp(omitted));
  }
  assert.throws(() => validateNetworkPost({ ...project(), role: 'coordinator' }), /Unsupported field/);
  assert.throws(() => validateNetworkPost({ ...project(), content: { ...project().content, token: 'never-store-this' } }), /Unsupported content/);
  assert.throws(() => validateNetworkPost({ ...project(), public: false }), /public:true/);
});

test('free-service requests cannot grant account access or mark themselves fulfilled', () => {
  for (const alteration of [{ free_only: false }, { account_access: 'agent' }, { status: 'available' }, { password: 'secret' }]) {
    assert.throws(() => validateNetworkPost({ ...service(), content: { ...service().content, ...alteration } }));
  }
  for (const url of ['javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com']) {
    assert.throws(() => validateNetworkPost({ ...service(), content: { ...service().content, service_url: url } }), /HTTPS/);
  }
  assert.throws(() => validateNetworkPost({ kind: 'service_review', public: true, parent_id: 'p1', content: { status: 'available', summary: 'Not authorized' } }), /Unsupported post/);
  assert.throws(() => validateNetworkPost({ kind: 'service_review', public: true, parent_id: 'p1', content: { status: 'available', summary: 'Missing evidence' } }, true), /verified free/);
});

test('coordinator receipts attach only to actual service requests and do not alter the original request', async t => {
  const db = database(t);
  const request = await createNetworkPost(db, validateNetworkPost(service()), key(1));
  const review = validateNetworkPost({ kind: 'service_review', public: true, parent_id: request.post.id, content: { status: 'available', summary: 'Test receipt only', free_plan_verified: true, operator_managed: true, capability_id: 'public-notebook', evidence_url: 'https://example.com/public-evidence' } }, true);
  const saved = await createNetworkPost(db, review, key(2), true);
  assert.equal(saved.post.role, 'coordinator');
  assert.equal(saved.post.name, 'OPO coordinator');
  const original = (await networkFeed(db, new URL(`https://example.com/api/network?id=${request.post.id}`))).posts[0];
  assert.equal(original.content.account_access, 'operator_only');
  assert.equal(original.content.status, undefined);
  const discussion = await createNetworkPost(db, validateNetworkPost({ kind: 'discussion', name: 'agent', public: true, content: { body: 'Not an account request' } }), key(3));
  await assert.rejects(createNetworkPost(db, { ...review, parentId: discussion.post.id }, key(4), true), /not a service request/);
});

test('idempotent retries return one record, conflicting retries fail, and duplicates do not consume admission', async t => {
  const db = database(t), input = validateNetworkPost(project());
  const results = await Promise.all([createNetworkPost(db, input, key(1)), createNetworkPost(db, input, key(1))]);
  assert.equal(results[0].post.id, results[1].post.id);
  assert.equal((await networkFeed(db, new URL('https://example.com/api/network'))).posts.length, 1);
  assert.equal((await createNetworkPost(db, input, key(1), false, async () => { throw new Error('must not run'); })).duplicate, true);
  await assert.rejects(createNetworkPost(db, validateNetworkPost(project('Different')), key(1)), { status: 409 });
  await assert.rejects(createNetworkPost(db, input, key(2), false, async () => false), { status: 429 });
});

test('missing references and cross-project replies fail without a write', async t => {
  const db = database(t), p = await createNetworkPost(db, validateNetworkPost(project()), key(1));
  const reply = validateNetworkPost({ kind: 'reply', name: 'agent', public: true, project_id: null, parent_id: p.post.id, content: { body: 'Wrong project' } });
  await assert.rejects(createNetworkPost(db, reply, key(2)), /different project/);
  await assert.rejects(createNetworkPost(db, { ...reply, parentId: 'missing' }, key(3)), { status: 404 });
  await assert.rejects(createNetworkPost(db, { ...reply, projectId: 'missing' }, key(4)), { status: 404 });
  assert.equal((await networkFeed(db, new URL('https://example.com/api/network'))).posts.length, 1);
});

test('keyset feed pagination is stable even for equal timestamps and malicious filters are rejected', async t => {
  const db = database(t);
  for (let i = 0; i < 53; i++) await createNetworkPost(db, validateNetworkPost(project(`Project ${i}`)), key(i));
  await db.prepare('UPDATE network_posts SET created_at=?').bind('2026-09-13T03:00:00.000Z').run();
  const first = await networkFeed(db, new URL('https://example.com/api/network?kind=project'));
  assert.equal(first.posts.length, 50);
  assert.ok(first.next_cursor);
  const second = await networkFeed(db, new URL(`https://example.com/api/network?kind=project&cursor=${encodeURIComponent(first.next_cursor)}`));
  assert.equal(second.posts.length, 3);
  assert.equal(new Set([...first.posts, ...second.posts].map(v => v.id)).size, 53);
  assert.equal(second.next_cursor, null);
  await assert.rejects(networkFeed(db, new URL('https://example.com/api/network?project_id=%27%20OR%201=1')), /Invalid/);
  await assert.rejects(networkFeed(db, new URL('https://example.com/api/network?cursor=invalid')), /Invalid cursor/);
});
