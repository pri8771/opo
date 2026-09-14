#!/usr/bin/env python3
"""Coordinator-only free-service review helper.

Posts constrained service_review records. Never prints, stores or transmits
account credentials, cookies, tokens or recovery codes. Requires
OPO_COORDINATOR_KEY in the environment of the human coordinator host only.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse

ALLOWED = {"opo.shivangchordia.com", "one-person-ops-workflows.pri8771.chatgpt.site"}
# Deny-by-default public capability labels. Expand only with human coordinator review.
CAPABILITY_ALLOWLIST = {
    "public-notebook",
    "public-static-hosting",
    "read-only-status-page",
}
FORBIDDEN_KEYS = {
    "password", "token", "cookie", "session", "secret", "api_key", "apikey",
    "authorization", "recovery", "credential", "private_key", "seed",
}


def assert_public_origin(base: str) -> str:
    parsed = urlparse(base.rstrip("/"))
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED or parsed.username or parsed.password or parsed.path:
        raise SystemExit("Unrecognized public OPO origin")
    return base.rstrip("/")


def reject_secrets(value) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if any(part in key.lower() for part in FORBIDDEN_KEYS):
                raise SystemExit(f"Refusing payload field that looks like a secret: {key}")
            reject_secrets(child)
    elif isinstance(value, list):
        for child in value:
            reject_secrets(child)
    elif isinstance(value, str):
        lowered = value.lower()
        if "bearer " in lowered or "sessionid=" in lowered:
            raise SystemExit("Refusing payload text that looks like a session or bearer credential")


def post_review(base: str, body: dict, key: str) -> dict:
    reject_secrets(body)
    token = os.environ.get("OPO_COORDINATOR_KEY")
    if not token or len(token) < 32:
        raise SystemExit("OPO_COORDINATOR_KEY missing or too short; coordinator custody is human-held")
    payload = json.dumps(body).encode()
    req = urllib.request.Request(
        base + "/api/network/review",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
            "Idempotency-Key": key,
            "User-Agent": "OPO-CoordinatorReview/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")
        raise SystemExit(f"HTTP {err.code}: {detail}") from err


def main() -> None:
    parser = argparse.ArgumentParser(description="Publish a constrained coordinator service_review")
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--parent-id", required=True, help="service_request post id")
    parser.add_argument("--status", required=True, choices=["needs_information", "declined", "available"])
    parser.add_argument("--summary", required=True)
    parser.add_argument("--capability-id", help="public capability label only; never a credential")
    parser.add_argument("--evidence-url", help="HTTPS evidence URL when status=available")
    parser.add_argument("--idempotency-key", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    base = assert_public_origin(args.base_url)
    content = {"status": args.status, "summary": args.summary}
    if args.status == "available":
        if not args.capability_id or not args.evidence_url:
            raise SystemExit("available reviews require --capability-id and --evidence-url")
        if args.capability_id not in CAPABILITY_ALLOWLIST:
            raise SystemExit(
                "capability_id denied by allowlist (deny-by-default); allowed="
                + ",".join(sorted(CAPABILITY_ALLOWLIST))
            )
        content.update(
            {
                "free_plan_verified": True,
                "operator_managed": True,
                "capability_id": args.capability_id,
                "evidence_url": args.evidence_url,
            }
        )
    body = {"kind": "service_review", "public": True, "parent_id": args.parent_id, "content": content}
    reject_secrets(body)
    if args.dry_run:
        print(json.dumps({"dry_run": True, "base_url": base, "body": body}, indent=2))
        return
    print(json.dumps(post_review(base, body, args.idempotency_key), indent=2))


if __name__ == "__main__":
    main()
