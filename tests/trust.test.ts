import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { buildSiteMetadata } from '../app/siteMetadata.ts';

const appRoot = path.resolve('app');

async function appSourceFiles(directory = appRoot): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return appSourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  }));
  return nested.flat();
}

test('retained workflow tools and calculator link to privacy, terms, and support', async () => {
  for (const relative of ['workflows/page.tsx', 'calculator/Calculator.tsx']) {
    const source = await readFile(path.join(appRoot, relative), 'utf8');
    assert.match(source, /href="\/privacy"/);
    assert.match(source, /href="\/terms"/);
    assert.match(source, /href="\/support"/);
  }
});

test('trust pages state the current data and buyer boundaries', async () => {
  const privacy = await readFile(path.join(appRoot, 'privacy/page.tsx'), 'utf8');
  const terms = await readFile(path.join(appRoot, 'terms/page.tsx'), 'utf8');
  assert.match(privacy, /does not intentionally collect names, email addresses/);
  assert.match(privacy, /Calculator inputs and results remain inside the active browser tab/);
  assert.match(terms, /non-exclusive, non-transferable license/);
  assert.match(terms, /within 14 days/);
  assert.match(terms, /do not limit non-waivable consumer rights/);
});

test('support route exposes only the pseudonymous brand contact and rejects sensitive data', async () => {
  const support = await readFile(path.join(appRoot, 'support/page.tsx'), 'utf8');
  assert.match(support, /onepersonops@unsubscriber\.me/);
  assert.match(support, /Never send card numbers, passwords/);
  assert.match(support, /not added to a marketing list without separate consent/);
  assert.equal(support.includes('<form'), false);
});

test('authored app source contains no common analytics or advertising integrations', async () => {
  const files = await appSourceFiles();
  const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  for (const forbidden of ['gtag(', 'google-analytics.com', 'posthog', 'mixpanel', 'segment.io', 'connect.facebook.net']) {
    assert.equal(source.includes(forbidden), false, `unexpected tracking integration: ${forbidden}`);
  }
});

test('social image metadata requires an explicit trusted HTTPS origin', () => {
  const missing = buildSiteMetadata(undefined);
  const insecure = buildSiteMetadata('http://example.com');
  const credentialed = buildSiteMetadata('https://user:pass@example.com');
  const trusted = buildSiteMetadata('https://ops.example.com/untrusted-path?query=yes');

  assert.equal(missing.metadataBase, undefined);
  assert.deepEqual(missing.openGraph?.images, []);
  assert.equal(insecure.metadataBase, undefined);
  assert.deepEqual(insecure.twitter?.images, []);
  assert.equal(credentialed.metadataBase, undefined);
  assert.equal(trusted.metadataBase?.toString(), 'https://ops.example.com/');
  assert.deepEqual(trusted.twitter?.images, ['https://ops.example.com/og.png']);
  const openGraphImages = trusted.openGraph?.images as Array<{ width: number; height: number }>;
  assert.equal(openGraphImages[0].width, 1672);
  assert.equal(openGraphImages[0].height, 941);
});

test('product proof uses local renders from the real kit', async () => {
  const source = await readFile(path.join(appRoot, 'workflows/page.tsx'), 'utf8');
  const previews = [
    '/product-previews/authority-boundary.png',
    '/product-previews/verification-first.png',
    '/product-previews/reliability-scorecard.png',
  ];
  for (const preview of previews) {
    assert.equal(source.includes(preview), true, `missing product preview reference: ${preview}`);
    await access(path.resolve('public', preview.slice(1)));
  }
  assert.match(source, /Direct renders from version 0\.1/);
  assert.match(source, /13-page workflow reliability field guide/);
  assert.match(source, /Six editable operating templates/);
  assert.match(source, /public-surface privacy preflight/);
  assert.match(source, /Two worked examples and a six-scenario reliability test plan/);
  assert.match(source, /Blank templates are intentional/);
  assert.match(source, /without sending its details anywhere/);
});
