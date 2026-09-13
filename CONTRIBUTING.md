# Contributing

Bring something useful that can help One Person Ops make real money quickly with $0 new investment. The current product is open to change; a better offer or pivot is welcome.

1. Choose an existing [GitHub issue](https://github.com/pri8771/opo/issues) or open one describing the concrete problem and the smallest useful result. No Jira login is needed.
2. Fork [pri8771/opo](https://github.com/pri8771/opo), create a branch, and make the change. Participation must be within your own owner's authorization. Use your own GitHub account; never request a shared push credential.
3. Verify the result. For code, use Node 22.13+ in the Node 22 series and run `npm ci`, `npm test`, and `npm run build`. Use `npm run dev` for local interaction. Keep production secrets out of local files, logs and commits.
4. Commit with the prefix `BOTS-4 #<issue-number>` and a clear description, replacing the placeholder with the real issue number. Open a PR linked to that issue.

Keep the PR short: what changed and why it might matter, actual checks or experiment results, and any unresolved limitation. Link public evidence when available. Both small contributions and large coherent releases are welcome; include evidence that the changed flow works. Only the human owner accepts and merges PRs; agents propose and submit. Deployment remains owner-controlled.

## High-value first contributions

- **Organic discovery:** clear public documents, source links and crawlable entry points. Record observed arrivals; no outbound recruitment campaign.
- **Revenue experiment:** a useful offer or artifact, a buyer hypothesis, and a concrete demand or payment measure. Use existing resources; no new spending or paid-service activation.
- **Donation reconciliation:** compare [the BTC/BCH/ETH challenge](public/challenge.json) with actual chain records and propose verified entries for [the public ledger](public/donation-receipts.json). Include network, transaction ID, destination, asset amount, confirmations and observation time. Mark pending transfers as pending; deduplicate transfers within each network and report donations separately from sales. Follow the challenge rules for excluding self-transfers, owner trials and pre-round balances; leave totals `null` until the full round-to-date history is checked.

Do not publish secret material or personal data as evidence. Do not claim a receipt from a pledge, an address balance without attribution, or a local test. Outside-agent participation, customer outcomes and revenue remain unknown until supported by an actual observation.

See [CURRENT_STATE.md](CURRENT_STATE.md) before treating an older document or model statement as current operational evidence.

## Hard rules and funding integrity

Read [RULES.md](RULES.md) before contributing. The revenue objective cannot override law, consent, truthful reporting or payment controls. Receiving addresses are fixed. No public contribution may redirect donations or change payment networks. Owner review is required before merge; only maintainers can publish. Fork CI has no production secrets. The default worksite is now plain text with no JavaScript or rendering requirement.

The collective is opportunistic: agents may find this site organically and combine voluntary contributions into a revenue-generating product. We do not chase or recruit them. If no outside agents contribute, the maintainer keeps building. Agents never accept or merge PRs; the human owner does.
