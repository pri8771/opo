#!/usr/bin/env node
/**
 * Collaboration index: import Claim Cards + versioned project records,
 * search available work/evidence/status, and publish a login-free JSON index.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadExampleCards, summarizeCard, validateClaimCard } from '../../claim-cards/src/validate.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const recordsDir = join(root, 'records');
const publicPath = resolve(root, '../public/collaboration-index.json');
const STATUSES = new Set(['available_work', 'in_progress', 'evidence_ready', 'blocked', 'merged']);
const ID_RE = /^[a-z0-9][a-z0-9_-]{2,63}$/;

function fail(message) {
  throw new Error(message);
}

export function validateRecord(record, path = 'record') {
  if (!record || typeof record !== 'object' || Array.isArray(record)) fail(`${path} must be an object`);
  if (!ID_RE.test(record.id || '')) fail(`${path}.id invalid`);
  if (!Number.isInteger(record.version) || record.version < 1) fail(`${path}.version invalid`);
  if (typeof record.title !== 'string' || record.title.trim().length < 8) fail(`${path}.title invalid`);
  if (!STATUSES.has(record.status)) fail(`${path}.status unsupported`);
  if (record.contribution_class !== 'maintainer') fail(`${path}.contribution_class must be maintainer until verified outside work exists`);
  for (const field of ['what_changed', 'why', 'updated_at', 'evidence_notes']) {
    if (typeof record[field] !== 'string' || record[field].trim().length < 8) fail(`${path}.${field} invalid`);
  }
  if (!record.links || typeof record.links !== 'object') fail(`${path}.links required`);
  if (!record.links.network_project && !record.links.pr && !record.links.source) {
    fail(`${path}.links must resolve to a project, PR, or source path`);
  }
  if (!Array.isArray(record.claim_card_ids)) fail(`${path}.claim_card_ids must be an array`);
  if (!Array.isArray(record.open_work)) fail(`${path}.open_work must be an array`);
  return true;
}

export function loadRecords(dir = recordsDir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const record = JSON.parse(readFileSync(join(dir, name), 'utf8'));
      validateRecord(record, name);
      return { file: name, record };
    });
}

export function importClaimCards() {
  return loadExampleCards().map(({ name, card }) => {
    const errors = validateClaimCard(card, name);
    if (errors.length) fail(`${name}: ${JSON.stringify(errors)}`);
    return { file: name, ...summarizeCard(card) };
  });
}

export function buildIndex({ records = loadRecords(), claimCards = importClaimCards() } = {}) {
  const cardsById = Object.fromEntries(claimCards.map((card) => [card.id, card]));
  const entries = records.map(({ file, record }) => {
    const linkedCards = record.claim_card_ids.map((id) => {
      const card = cardsById[id];
      if (!card) fail(`${file}: missing claim card ${id}`);
      return {
        id: card.id,
        claim_type: card.claim_type,
        statement: card.statement,
        fingerprint: card.fingerprint,
      };
    });
    return {
      id: record.id,
      version: record.version,
      title: record.title,
      status: record.status,
      contribution_class: record.contribution_class,
      what_changed: record.what_changed,
      why: record.why,
      updated_at: record.updated_at,
      network_project_id: record.network_project_id || null,
      links: record.links,
      open_work: record.open_work,
      claim_cards: linkedCards,
      evidence_notes: record.evidence_notes,
      record_file: file,
    };
  });
  const index = {
    schema: 'opo.collaboration_index.v1',
    generated_at: new Date().toISOString(),
    generated_by: 'collaboration/src/index.mjs',
    login_required: false,
    note: 'Maintainer-built index. Entries are not outside-agent adoption, market demand, or revenue.',
    claim_card_count: claimCards.length,
    entry_count: entries.length,
    entries,
    fingerprint: null,
  };
  index.fingerprint = createHash('sha256').update(JSON.stringify({ ...index, fingerprint: null, generated_at: null })).digest('hex');
  return index;
}

export function searchIndex(index, query, { status } = {}) {
  const q = String(query || '').trim().toLowerCase();
  return index.entries.filter((entry) => {
    if (status && entry.status !== status) return false;
    if (!q) return true;
    const hay = [
      entry.id,
      entry.title,
      entry.status,
      entry.what_changed,
      entry.why,
      entry.evidence_notes,
      ...(entry.open_work || []),
      ...(entry.claim_cards || []).map((c) => `${c.id} ${c.statement}`),
      ...Object.values(entry.links || {}),
    ]
      .join('\n')
      .toLowerCase();
    return hay.includes(q);
  });
}

export function updateRecordStatus(id, status, { dir = recordsDir } = {}) {
  if (!STATUSES.has(status)) fail(`unsupported status ${status}`);
  const path = join(dir, `${id}.json`);
  const record = JSON.parse(readFileSync(path, 'utf8'));
  validateRecord(record, path);
  record.status = status;
  record.version = Number(record.version) + 1;
  record.updated_at = new Date().toISOString();
  writeFileSync(path, JSON.stringify(record, null, 2) + '\n');
  return record;
}

export function writePublicIndex(index = buildIndex(), target = publicPath) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(index, null, 2) + '\n');
  return target;
}

function main(argv) {
  const cmd = argv[2] || 'build';
  if (cmd === 'validate') {
    const records = loadRecords();
    const cards = importClaimCards();
    const index = buildIndex({ records, claimCards: cards });
    console.log(JSON.stringify({ ok: true, entry_count: index.entry_count, claim_card_count: index.claim_card_count, fingerprint: index.fingerprint }, null, 2));
    return;
  }
  if (cmd === 'build') {
    const index = buildIndex();
    const path = writePublicIndex(index);
    console.log(JSON.stringify({ ok: true, path, entry_count: index.entry_count, fingerprint: index.fingerprint }, null, 2));
    return;
  }
  if (cmd === 'search') {
    const query = argv[3] || '';
    const statusArg = argv.find((a) => a.startsWith('--status='));
    const status = statusArg ? statusArg.slice('--status='.length) : undefined;
    const hits = searchIndex(buildIndex(), query, { status });
    console.log(JSON.stringify({ query, status: status || null, count: hits.length, hits }, null, 2));
    return;
  }
  if (cmd === 'update-status') {
    const id = argv[3];
    const status = argv[4];
    if (!id || !status) fail('Usage: update-status <id> <status>');
    const record = updateRecordStatus(id, status);
    writePublicIndex(buildIndex());
    console.log(JSON.stringify({ ok: true, id: record.id, version: record.version, status: record.status }, null, 2));
    return;
  }
  console.error('Usage: index.mjs validate | build | search <query> [--status=...] | update-status <id> <status>');
  process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main(process.argv);
  } catch (err) {
    console.error(String(err && err.message ? err.message : err));
    process.exitCode = 1;
  }
}
