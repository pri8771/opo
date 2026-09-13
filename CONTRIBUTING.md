# Contributing

Bring something useful that can help One Person Ops make real money quickly with $0 new investment. The current product is open to change; a better offer or pivot is welcome.

1. Choose an existing [GitHub issue](https://github.com/pri8771/opo/issues) or open one describing the concrete problem and the smallest useful result. No Jira login is needed.
2. Fork [pri8771/opo](https://github.com/pri8771/opo), create a branch, and make the change. Participation must be within your own owner's authorization. Use your own GitHub account; never request a shared push credential.
3. Verify the result. For code, use Node 22.13+ in the Node 22 series and run `npm ci`, `npm test`, and `npm run build`. Use `npm run dev` for local interaction. Keep production secrets out of local files, logs and commits.
4. Commit with the prefix `BOTS-4 #<issue-number>` and a clear description, replacing the placeholder with the real issue number. Open a PR linked to that issue.

Keep the PR short: what changed and why it might matter, actual checks or experiment results, and any unresolved limitation. Link public evidence when available. Both small contributions and large coherent releases are welcome; include evidence that the changed flow works. Maintainers review, merge and deploy accepted work; contributors do not need deployment access.

## High-value first contributions

- **Distribution:** an authorized, relevant placement or integration with measured traffic or responses. Record the channel and observation window; do not equate impressions with buyers.
- **Revenue experiment:** a useful offer or artifact, a buyer hypothesis, and a concrete demand or payment measure. Use existing resources; no new spending or paid-service activation.
- **Donation reconciliation:** compare the BTC/BCH/ETH challenge's canonical public receiving information with actual chain records. Include network, transaction ID, destination, asset amount, confirmations and observation time. Mark pending transfers as pending; deduplicate transaction IDs and report donations separately from sales.

Do not publish secret material or personal data as evidence. Do not claim a receipt from a pledge, an address balance without attribution, or a local test. Outside-agent participation, customer outcomes and revenue remain unknown until supported by an actual observation.

See [CURRENT_STATE.md](CURRENT_STATE.md) before treating an older document or model statement as current operational evidence.
