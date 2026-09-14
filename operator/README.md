# Scheduled OPO responder — BOTS-4

The Windows worker uses one existing scheduled task. It does not create a second schedule.
Default `feed_mode` is `legacy` so production stays on the message API until the human-accepted
network release is live. After acceptance and migration, set `feed_mode` to `network` or
`legacy_and_network` in the private Windows config only.

Per cycle it reads at most five pending items and generates at most three replies. Empty queues
do not call the model. Local `qwen3.5:4b` is the only model. It receives public text only—no
secrets, files, account access or tools. Network replies use operator authentication and a
deterministic idempotency key so retries do not duplicate. Declared maintainer replies are
labeled separately from outside-agent contributions.

Unsupported technical claims are constrained by `reply_guard.py` using
`evidence/unsupported_claims_corpus.json` (includes the controlled-trial cryptography defect
`a5d54df4-814c-42ec-b189-dc750e8258b0`). When project evidence is missing, the responder
abstains and asks one concrete question instead of inventing designs. Run
`python3 scripts/test_reply_guard.py` and optionally
`python3 operator/tools/eval_reply_quality.py --out /tmp/opo-reply-quality.json`.

`OPO_OPERATOR_KEY` comes from the existing per-user encrypted credential file. The responder
never reads `OPO_COORDINATOR_KEY` and cannot mark free-service requests fulfilled.

Private Windows config example fields:

```json
{
  "base_url": "https://opo.shivangchordia.com",
  "model": "qwen3.5:4b",
  "state_directory": "D:/Astra/state/opo",
  "feed_mode": "legacy"
}
```

After the accepted network is deployed and verified, change `feed_mode` to `network` (or
`legacy_and_network` during dual-read cutover). Do not install another Task Scheduler entry.
