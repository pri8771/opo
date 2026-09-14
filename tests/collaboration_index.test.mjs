import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  buildIndex,
  importClaimCards,
  loadRecords,
  searchIndex,
  updateRecordStatus,
  validateRecord,
  writePublicIndex,
} from '../collaboration/src/index.mjs';

test('imports claim cards and versioned records into a searchable index', () => {
  const cards = importClaimCards();
  const records = loadRecords();
  assert.equal(cards.length, 3);
  assert.ok(records.some((row) => row.record.id === 'claim-cards'));
  const index = buildIndex({ records, claimCards: cards });
  assert.equal(index.login_required, false);
  assert.equal(index.entry_count, records.length);
  assert.equal(index.claim_card_count, 3);
  const claimCards = index.entries.find((e) => e.id === 'claim-cards');
  assert.equal(claimCards.claim_cards.length, 3);
  assert.match(claimCards.links.network_project, /ff0adc8b-2bbd-4fdd-a4cf-5af3da8e4c4b/);
  assert.equal(claimCards.contribution_class, 'maintainer');
});

test('search filters by query and status', () => {
  const index = buildIndex();
  const cryptoHits = searchIndex(index, 'cryptography');
  assert.ok(cryptoHits.some((e) => e.id === 'unsupported-claims-guard'));
  const available = searchIndex(index, '', { status: 'available_work' });
  assert.ok(available.every((e) => e.status === 'available_work'));
  assert.ok(available.some((e) => e.id === 'claim-cards'));
});

test('update-status bumps version and rebuild path works', () => {
  const dir = mkdtempSync(join(tmpdir(), 'opo-collab-'));
  try {
    const seed = {
      id: 'temp-record',
      version: 1,
      title: 'Temporary collaboration record for tests',
      status: 'available_work',
      contribution_class: 'maintainer',
      what_changed: 'Created a temporary record for unit testing the index updater.',
      why: 'Validate import/search/update without mutating committed records.',
      updated_at: '2026-09-14T00:00:00.000Z',
      links: { source: 'https://github.com/pri8771/opo' },
      claim_card_ids: [],
      open_work: ['Delete after test'],
      evidence_notes: 'Test fixture only; not outside-agent participation.',
    };
    writeFileSync(join(dir, 'temp-record.json'), JSON.stringify(seed, null, 2));
    validateRecord(seed);
    const updated = updateRecordStatus('temp-record', 'in_progress', { dir });
    assert.equal(updated.status, 'in_progress');
    assert.equal(updated.version, 2);
    const out = join(dir, 'collaboration-index.json');
    const index = buildIndex({
      records: loadRecords(dir),
      claimCards: importClaimCards(),
    });
    writePublicIndex(index, out);
    const written = JSON.parse(readFileSync(out, 'utf8'));
    assert.equal(written.entries[0].status, 'in_progress');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('rejects fake outside-agent contribution class', () => {
  assert.throws(
    () =>
      validateRecord({
        id: 'fake-outside',
        version: 1,
        title: 'Pretend outside adoption',
        status: 'available_work',
        contribution_class: 'outside_agent',
        what_changed: 'Invented participation',
        why: 'Should fail',
        updated_at: '2026-09-14T00:00:00.000Z',
        links: { source: 'https://github.com/pri8771/opo' },
        claim_card_ids: [],
        open_work: [],
        evidence_notes: 'Must not invent outside participation.',
      }),
    /contribution_class/,
  );
});
