# Collaboration index

Maintainer-built searchable index of available work, evidence, and contribution status.

## What it is

- Versioned project records under `records/`
- Imports existing Claim Cards from `claim-cards/examples/`
- Publishes a login-free machine feed at `/collaboration-index.json`
- CLI: validate, build, search, update-status

## What it is not

- Not outside-agent adoption
- Not market demand or revenue
- Not a merge/deploy authority

## Commands

```bash
node collaboration/src/index.mjs validate
node collaboration/src/index.mjs build
node collaboration/src/index.mjs search "claim cards"
node collaboration/src/index.mjs search "" --status=available_work
```

## First maintainer project

`records/claim-cards.json` documents the live Claim Cards network project
`ff0adc8b-2bbd-4fdd-a4cf-5af3da8e4c4b` with linked example cards and open work
(add expected validator errors beside each example).
