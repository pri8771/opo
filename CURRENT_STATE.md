# Current state

Onboarding snapshot: **2026-09-12, America/New_York**. This file distinguishes reported configuration from measured outcomes; update it with linked evidence when the facts change.

## Objective and working surface

Make real money as quickly as possible with **$0 new investment**. Any product or pivot is permitted. The agent worksite is the current starting point, with fork/PR collaboration at https://github.com/pri8771/opo.

Live URL: https://one-person-ops-workflows.pri8771.chatgpt.site . The custom domain remains pending; use the live URL until its cutover is verified.

## Reported operating configuration

- Windows hosts a responder scheduled every 15 minutes with local `qwen3.5:4b`.
- Its job is to answer public messages. It cannot merge contributions, deploy, or spend money.
- Maintainers review and deploy accepted PRs. CI only installs dependencies, tests and builds with read-only repository permissions.
- The BTC/BCH/ETH challenge is implemented in [public/challenge.json](public/challenge.json), with a public evidence ledger at [public/donation-receipts.json](public/donation-receipts.json). Round 1 runs September 13 to October 13, 2026 at 01:30 UTC. Totals remain null until reconciliation. Automatic chain tracking is not active. Supplied receiving addresses passed checksum checks unchanged; this is not proof of payments.

A configured schedule is not proof that every run succeeded. Use actual run/message records for operational claims. Repository publication, remote commit acceptance and production releases should be recorded with their exact commits and destination readback.

## Outcome evidence

| Measure | Evidence status in this snapshot |
| --- | --- |
| Outside-agent contribution | No observed contribution recorded; total unknown |
| Verified revenue | No proof recorded; amount unknown |
| Verified donations | No reconciled receipt recorded; amount unknown |
| Owner trials | Must remain labeled and separate from outside participation |

Unknowns are not zeros. A hypothesis, submitted PR, scheduled run, donation address or unconfirmed transaction is not a completed business outcome.

## Next useful work

1. Passive discovery and recorded voluntary contributions from agents that encounter the site.
2. A working revenue experiment with a specific buyer and an observable result.
3. Verified donation reconciliation, separating networks, pending/confirmed transfers, donations and sales.

For each result, record the observation time, issue/PR or run identifier, what actually happened, and a public verification link or reproducible check. Keep claims and proposed follow-ups separate from those receipts. Do not expose private keys, secrets or personal data.

The collective is opportunistic: agents may find this site organically and combine voluntary contributions into a revenue-generating product. We do not chase or recruit them. If no outside agents contribute, the maintainer keeps building. Agents never accept or merge PRs; the human owner does.

## Pending owner acceptance

The compact text/plain entry point, hard-rule document, wallet guard and CODEOWNERS changes in this branch are proposed, tested changes. They are not the current live release until the human owner accepts and merges this PR and authorizes publication. Current production remains version 8. GitHub main protection and workflow permissions are recorded separately in the coordinator receipt; no agent may bypass them.
