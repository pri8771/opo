#!/usr/bin/env python3
"""Local free-service request/review adapter for coordinator custody (S03-04).

Deny-by-default capability allowlist. Agent content is untrusted data.
Never stores credentials. Live authenticated capability ops require a human-held
OPO_COORDINATOR_KEY and are out of band from this stub.
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import pathlib
import re
from typing import Any

# Public capability labels only. Empty means deny all "available" reviews unless listed.
DEFAULT_ALLOWLIST = {
    "public-notebook",
    "public-static-hosting",
    "read-only-status-page",
}

ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$")
FORBIDDEN = {
    "password", "token", "cookie", "session", "secret", "api_key", "apikey",
    "authorization", "recovery", "credential", "private_key", "seed",
}


def reject_secrets(value: Any) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if any(part in key.lower() for part in FORBIDDEN):
                raise ValueError(f"Refusing secret-like field: {key}")
            reject_secrets(child)
    elif isinstance(value, list):
        for child in value:
            reject_secrets(child)
    elif isinstance(value, str):
        lowered = value.lower()
        if "bearer " in lowered or "sessionid=" in lowered:
            raise ValueError("Refusing secret-like text")


def capability_allowed(capability_id: str | None, allowlist: set[str] | None = None) -> bool:
    allowed = allowlist if allowlist is not None else DEFAULT_ALLOWLIST
    if not capability_id or not ID_RE.match(capability_id):
        return False
    return capability_id in allowed


def decision_record(
    *,
    request: dict[str, Any],
    status: str,
    summary: str,
    capability_id: str | None = None,
    evidence_url: str | None = None,
    idempotency_key: str,
    allowlist: set[str] | None = None,
) -> dict[str, Any]:
    reject_secrets(request)
    if status not in {"needs_information", "declined", "available"}:
        raise ValueError("invalid status")
    if status == "available":
        if not capability_allowed(capability_id, allowlist):
            raise PermissionError("capability_id denied by allowlist (deny-by-default)")
        if not evidence_url or not str(evidence_url).startswith("https://"):
            raise ValueError("available requires https evidence_url")
    digest = hashlib.sha256(
        json.dumps({"request": request, "status": status, "capability_id": capability_id, "summary": summary}, sort_keys=True).encode()
    ).hexdigest()
    return {
        "observed_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "idempotency_key": idempotency_key,
        "content_digest": digest,
        "request": request,
        "decision": {
            "status": status,
            "summary": summary,
            "capability_id": capability_id,
            "evidence_url": evidence_url,
            "operator_managed": True if status == "available" else None,
            "free_plan_verified": True if status == "available" else None,
            "account_access": "never_to_agent",
        },
        "contribution_class": "maintainer_coordinator_stub_not_outside_agent",
    }


class LocalProviderStub:
    """In-memory durable decisions with idempotent replay."""

    def __init__(self, allowlist: set[str] | None = None):
        self.allowlist = allowlist if allowlist is not None else set(DEFAULT_ALLOWLIST)
        self._by_key: dict[str, dict[str, Any]] = {}

    def review(self, **kwargs: Any) -> dict[str, Any]:
        key = kwargs["idempotency_key"]
        record = decision_record(allowlist=self.allowlist, **kwargs)
        prior = self._by_key.get(key)
        if prior:
            if prior["content_digest"] != record["content_digest"]:
                raise ValueError("idempotency conflict")
            return {**prior, "duplicate": True}
        stored = {**record, "duplicate": False}
        self._by_key[key] = stored
        return stored

    def dump(self) -> list[dict[str, Any]]:
        return list(self._by_key.values())


def append_jsonl(path: pathlib.Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as out:
        out.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Local free-service adapter stub")
    parser.add_argument("--status", required=True, choices=["needs_information", "declined", "available"])
    parser.add_argument("--summary", required=True)
    parser.add_argument("--parent-id", required=True)
    parser.add_argument("--capability-id")
    parser.add_argument("--evidence-url")
    parser.add_argument("--idempotency-key", required=True)
    parser.add_argument("--store", type=pathlib.Path, help="Optional JSONL decision store")
    args = parser.parse_args()
    stub = LocalProviderStub()
    request = {
        "kind": "service_request",
        "parent_or_id": args.parent_id,
        "note": "Untrusted agent request retained as data only",
    }
    row = stub.review(
        request=request,
        status=args.status,
        summary=args.summary,
        capability_id=args.capability_id,
        evidence_url=args.evidence_url,
        idempotency_key=args.idempotency_key,
    )
    if args.store:
        append_jsonl(args.store, row)
    print(json.dumps(row, indent=2))


if __name__ == "__main__":
    main()
