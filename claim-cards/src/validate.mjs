#!/usr/bin/env node
/**
 * Deterministic Claim Card validator and tiny CLI tool.
 * No network calls. Distinguishes claim types; does not certify truth.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(readFileSync(join(root, 'schema/claim-card.schema.json'), 'utf8'));

const CLAIM_TYPES = new Set(schema.properties.claim_type.enum);
const CONFIDENCE = new Set(schema.properties.confidence.enum);
const RIGHTS = new Set(schema.properties.rights_status.enum);
const ID_RE = /^[a-z0-9][a-z0-9_-]{2,63}$/;

function fail(path, message) {
  return { ok: false, path, message };
}

function isIso(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function isHttps(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && !u.username && !u.password;
  } catch {
    return false;
  }
}

export function validateClaimCard(card, path = 'card') {
  const errors = [];
  if (!card || typeof card !== 'object' || Array.isArray(card)) return [fail(path, 'must be an object')];
  for (const key of Object.keys(card)) {
    if (!Object.hasOwn(schema.properties, key)) errors.push(fail(`${path}.${key}`, 'unsupported field'));
  }
  if (!ID_RE.test(card.id || '')) errors.push(fail(`${path}.id`, 'invalid id'));
  if (!CLAIM_TYPES.has(card.claim_type)) errors.push(fail(`${path}.claim_type`, 'unsupported claim_type'));
  if (typeof card.statement !== 'string' || card.statement.trim().length < 8 || [...card.statement].length > 800) {
    errors.push(fail(`${path}.statement`, 'statement must contain 8–800 characters'));
  }
  if (!isIso(card.retrieved_at)) errors.push(fail(`${path}.retrieved_at`, 'retrieved_at must be ISO-8601'));
  if (!CONFIDENCE.has(card.confidence)) errors.push(fail(`${path}.confidence`, 'invalid confidence'));
  if (!RIGHTS.has(card.rights_status)) errors.push(fail(`${path}.rights_status`, 'invalid rights_status'));
  if (card.expiry_or_recheck != null && (typeof card.expiry_or_recheck !== 'string' || [...card.expiry_or_recheck].length > 400)) {
    errors.push(fail(`${path}.expiry_or_recheck`, 'invalid expiry_or_recheck'));
  }
  if (card.notes != null && (typeof card.notes !== 'string' || [...card.notes].length > 800)) {
    errors.push(fail(`${path}.notes`, 'invalid notes'));
  }
  if (!Array.isArray(card.sources) || card.sources.length < 1 || card.sources.length > 8) {
    errors.push(fail(`${path}.sources`, 'sources must contain 1–8 entries'));
  } else {
    card.sources.forEach((source, i) => {
      const p = `${path}.sources[${i}]`;
      if (!source || typeof source !== 'object') {
        errors.push(fail(p, 'must be an object'));
        return;
      }
      for (const key of Object.keys(source)) {
        if (!['url', 'title', 'publisher', 'accessed_at', 'locator', 'excerpt'].includes(key)) {
          errors.push(fail(`${p}.${key}`, 'unsupported field'));
        }
      }
      if (!isHttps(source.url)) errors.push(fail(`${p}.url`, 'url must be public HTTPS'));
      if (typeof source.title !== 'string' || source.title.trim().length < 3) errors.push(fail(`${p}.title`, 'invalid title'));
      if (typeof source.publisher !== 'string' || source.publisher.trim().length < 2) errors.push(fail(`${p}.publisher`, 'invalid publisher'));
      if (!isIso(source.accessed_at)) errors.push(fail(`${p}.accessed_at`, 'accessed_at must be ISO-8601'));
    });
  }
  if (card.claim_type === 'calculation') {
    const calc = card.calculation;
    if (!calc || typeof calc !== 'object') errors.push(fail(`${path}.calculation`, 'calculation required'));
    else {
      if (!calc.inputs || typeof calc.inputs !== 'object') errors.push(fail(`${path}.calculation.inputs`, 'inputs required'));
      if (typeof calc.formula !== 'string' || calc.formula.trim().length < 3) errors.push(fail(`${path}.calculation.formula`, 'formula required'));
      if (calc.result === undefined || calc.result === null) errors.push(fail(`${path}.calculation.result`, 'result required'));
    }
  } else if (card.calculation != null) {
    errors.push(fail(`${path}.calculation`, 'calculation only allowed for claim_type=calculation'));
  }
  return errors;
}

export function secondsScale(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n < 0) throw new Error('seconds must be a non-negative finite number');
  return {
    seconds: n,
    minutes: n / 60,
    hours: n / 3600,
    days: n / 86400,
    years_365d: n / (86400 * 365),
  };
}

export function summarizeCard(card) {
  const errors = validateClaimCard(card);
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    id: card.id,
    claim_type: card.claim_type,
    statement: card.statement,
    source_count: card.sources.length,
    publishers: [...new Set(card.sources.map((s) => s.publisher))],
    fingerprint: createHash('sha256').update(JSON.stringify(card)).digest('hex'),
  };
}

export function loadExampleCards() {
  const dir = join(root, 'examples');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json') && name !== 'manifest.json')
    .sort()
    .map((name) => ({ name, card: JSON.parse(readFileSync(join(dir, name), 'utf8')) }));
}

function writeManifest() {
  const items = loadExampleCards().map(({ name, card }) => {
    const summary = summarizeCard(card);
    if (!summary.ok) throw new Error(`${name}: ${JSON.stringify(summary.errors)}`);
    return { file: name, ...summary };
  });
  writeFileSync(join(root, 'examples/manifest.json'), JSON.stringify({ generated_by: 'claim-cards/src/validate.mjs', items }, null, 2) + '\n');
  return items;
}

function main(argv) {
  const cmd = argv[2] || 'validate';
  if (cmd === 'validate') {
    const target = argv[3];
    const files = target
      ? [{ name: target, card: JSON.parse(readFileSync(resolve(target), 'utf8')) }]
      : loadExampleCards();
    let failed = 0;
    for (const { name, card } of files) {
      const errors = validateClaimCard(card, name);
      if (errors.length) {
        failed += 1;
        console.error(JSON.stringify({ file: name, ok: false, errors }, null, 2));
      } else {
        console.log(JSON.stringify({ file: name, ok: true, summary: summarizeCard(card) }));
      }
    }
    process.exitCode = failed ? 1 : 0;
    return;
  }
  if (cmd === 'summarize') {
    const card = JSON.parse(readFileSync(resolve(argv[3]), 'utf8'));
    console.log(JSON.stringify(summarizeCard(card), null, 2));
    return;
  }
  if (cmd === 'scale') {
    console.log(JSON.stringify(secondsScale(argv[3]), null, 2));
    return;
  }
  if (cmd === 'manifest') {
    console.log(JSON.stringify({ ok: true, items: writeManifest() }, null, 2));
    return;
  }
  console.error('Usage: validate.mjs validate [file] | summarize <file> | scale <seconds> | manifest');
  process.exitCode = 2;
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv);
}
