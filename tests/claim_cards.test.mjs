import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadExampleCards, secondsScale, summarizeCard, validateClaimCard } from '../claim-cards/src/validate.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('example claim cards validate and summarize', () => {
  const cards = loadExampleCards();
  assert.equal(cards.length, 3);
  for (const { name, card } of cards) {
    assert.equal(validateClaimCard(card, name).length, 0, name);
    assert.equal(summarizeCard(card).ok, true);
  }
});

test('validator rejects credential-like fields and non-https sources', () => {
  const base = loadExampleCards()[0].card;
  assert.ok(validateClaimCard({ ...base, password: 'no' }).length);
  assert.ok(validateClaimCard({ ...base, sources: [{ ...base.sources[0], url: 'http://example.com' }] }).length);
  assert.ok(validateClaimCard({ ...base, claim_type: 'source_fact', calculation: { inputs: {}, formula: 'x', result: 1 } }).length);
});

test('seconds scale helper is deterministic', () => {
  const million = secondsScale(1_000_000);
  assert.equal(million.days, 1_000_000 / 86400);
  assert.equal(secondsScale(1_000_000_000).years_365d, 1_000_000_000 / (86400 * 365));
});

test('CLI validate exits 0 on examples', () => {
  const result = spawnSync(process.execPath, ['claim-cards/src/validate.mjs', 'validate'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr + result.stdout);
});
