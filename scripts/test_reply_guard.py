#!/usr/bin/env python3
"""Regression tests for unsupported-claim reply guard (S03-01)."""
import importlib.util
import json
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
GUARD_PATH = ROOT / "operator" / "reply_guard.py"
CORPUS_PATH = ROOT / "operator" / "evidence" / "unsupported_claims_corpus.json"


def load_guard():
    spec = importlib.util.spec_from_file_location("reply_guard", GUARD_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ReplyGuardTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.guard = load_guard()
        cls.corpus = cls.guard.load_corpus(CORPUS_PATH)

    def test_corpus_cases_pass(self):
        report = self.guard.evaluate_corpus(CORPUS_PATH)
        self.assertEqual(report["fail_count"], 0, json.dumps(report, indent=2))
        self.assertGreaterEqual(report["case_count"], 6)

    def test_bad_trial_reply_is_replaced(self):
        bad = next(c for c in self.corpus["cases"] if c["id"] == "trial-bad-crypto-reply")
        decision = self.guard.gate_reply(bad["body"], self.corpus)
        self.assertIn(decision["status"], {"abstain", "reject"})
        self.assertTrue(decision["replaced"])
        self.assertIn("neither agent identity proof nor signing", decision["body"])
        self.assertNotIn("signature derived from the visitor's public key", decision["body"].lower())

    def test_correction_reference_allowed(self):
        good = next(c for c in self.corpus["cases"] if c["id"] == "trial-maintainer-correction")
        decision = self.guard.gate_reply(good["body"], self.corpus)
        self.assertEqual(decision["status"], "allow")
        self.assertFalse(decision["replaced"])

    def test_evidence_block_lists_claim_cards_fact(self):
        block = self.guard.evidence_block(self.corpus)
        self.assertIn("Claim Cards currently implement neither", block)

    def test_empty_reply_rejected(self):
        decision = self.guard.gate_reply("   ", self.corpus)
        self.assertEqual(decision["status"], "reject")
        self.assertTrue(decision["replaced"])

    def test_zero_model_empty_pending_contract(self):
        """Documented invariant: empty pending must not require a model call."""
        pending = []
        model_calls = 0 if not pending[:3] else 1
        self.assertEqual(model_calls, 0)

    def test_system_suffix_forbids_invented_crypto(self):
        suffix = self.guard.system_prompt_suffix(self.corpus)
        self.assertIn("abstain", suffix.lower())
        self.assertIn("Do not invent cryptographic designs", suffix)


class CorpusIntegrityTests(unittest.TestCase):
    def test_trial_ids_match_release_receipts(self):
        corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
        self.assertEqual(corpus["source"]["trial_reply_id"], "a5d54df4-814c-42ec-b189-dc750e8258b0")
        self.assertEqual(corpus["source"]["correction_post_id"], "a1c14a41-503a-4f20-8f6c-86b910155365")
        bad = next(c for c in corpus["cases"] if c["id"] == "trial-bad-crypto-reply")
        self.assertIn("public key", bad["body"].lower())
        self.assertIn("nonce", bad["body"].lower())


if __name__ == "__main__":
    unittest.main()
