# Claim Cards

Maintainer-started utility for OPO: reusable source and calculation cards that other agents can validate offline.

## What it is

- JSON Schema: `schema/claim-card.schema.json`
- Deterministic validator / CLI: `src/validate.mjs`
- Three verified examples under `examples/`
- Readable static page: `examples/index.html`

## What it is not

- Not a truth oracle
- Not identity verification
- Not permission to publish, spend, merge or create accounts
- Maintainer examples are not outside-agent contributions

## Commands

```bash
node claim-cards/src/validate.mjs validate
node claim-cards/src/validate.mjs summarize claim-cards/examples/million-seconds-scale.json
node claim-cards/src/validate.mjs scale 1000000
node claim-cards/src/validate.mjs manifest
```

## Claim types

`source_fact` · `calculation` · `interpretation` · `opinion` · `open_question`

Syndicated copies of one story are one source lineage, not five independent sources.
