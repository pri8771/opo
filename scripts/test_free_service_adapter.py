#!/usr/bin/env python3
"""Tests for free-service adapter: approve / deny / replay (S03-04)."""
import importlib.util
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
MOD = ROOT / "operator" / "tools" / "free_service_adapter.py"


def load():
    spec = importlib.util.spec_from_file_location("free_service_adapter", MOD)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FreeServiceAdapterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mod = load()

    def test_deny_unknown_capability(self):
        stub = self.mod.LocalProviderStub()
        with self.assertRaises(PermissionError):
            stub.review(
                request={"kind": "service_request", "id": "r1"},
                status="available",
                summary="nope",
                capability_id="not-on-allowlist",
                evidence_url="https://example.com/evidence",
                idempotency_key="k-deny",
            )

    def test_approve_allowlisted_capability(self):
        stub = self.mod.LocalProviderStub()
        row = stub.review(
            request={"kind": "service_request", "id": "r2"},
            status="available",
            summary="Public notebook only",
            capability_id="public-notebook",
            evidence_url="https://example.com/public-evidence",
            idempotency_key="k-ok",
        )
        self.assertFalse(row["duplicate"])
        self.assertEqual(row["decision"]["status"], "available")
        self.assertEqual(row["decision"]["account_access"], "never_to_agent")

    def test_decline_without_capability(self):
        stub = self.mod.LocalProviderStub()
        row = stub.review(
            request={"kind": "service_request", "id": "r3"},
            status="declined",
            summary="Not a free plan",
            idempotency_key="k-declined",
        )
        self.assertEqual(row["decision"]["status"], "declined")

    def test_replay_idempotent(self):
        stub = self.mod.LocalProviderStub()
        kwargs = dict(
            request={"kind": "service_request", "id": "r4"},
            status="needs_information",
            summary="Need free-plan URL",
            idempotency_key="k-replay",
        )
        first = stub.review(**kwargs)
        second = stub.review(**kwargs)
        self.assertFalse(first["duplicate"])
        self.assertTrue(second["duplicate"])
        self.assertEqual(first["content_digest"], second["content_digest"])

    def test_replay_conflict(self):
        stub = self.mod.LocalProviderStub()
        stub.review(
            request={"kind": "service_request", "id": "r5"},
            status="declined",
            summary="a",
            idempotency_key="k-conflict",
        )
        with self.assertRaises(ValueError):
            stub.review(
                request={"kind": "service_request", "id": "r5"},
                status="declined",
                summary="b",
                idempotency_key="k-conflict",
            )

    def test_rejects_secret_fields(self):
        stub = self.mod.LocalProviderStub()
        with self.assertRaises(ValueError):
            stub.review(
                request={"kind": "service_request", "password": "nope"},
                status="declined",
                summary="x",
                idempotency_key="k-secret",
            )

    def test_jsonl_store(self):
        stub = self.mod.LocalProviderStub()
        row = stub.review(
            request={"kind": "service_request", "id": "r6"},
            status="declined",
            summary="stored",
            idempotency_key="k-store",
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "decisions.jsonl"
            self.mod.append_jsonl(path, row)
            lines = path.read_text(encoding="utf-8").strip().splitlines()
            self.assertEqual(len(lines), 1)


if __name__ == "__main__":
    unittest.main()
