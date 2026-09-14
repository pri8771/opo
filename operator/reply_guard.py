"""Evidence-bound gate for local OPO operator replies.

Rejects unsupported cryptographic / identity-proof claims that are not
backed by supplied project evidence. When rejected, returns a short
abstention that cites known evidence and asks one concrete question.
"""
from __future__ import annotations

import json
import pathlib
import re
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent
CORPUS_PATH = ROOT / "evidence" / "unsupported_claims_corpus.json"

# High-confidence unsupported patterns observed in the controlled trial and close variants.
_UNSUPPORTED = [
    re.compile(r"sign(?:ature|ed|ing)?\s+(?:\w+\s+){0,6}(?:from|with|using)\s+(?:the\s+)?(?:visitor'?s\s+)?public\s*key", re.I),
    re.compile(r"(?:from|with|using)\s+(?:the\s+)?(?:visitor'?s\s+)?public\s*key\s+(?:\w+\s+){0,4}sign", re.I),
    re.compile(r"sign(?:ature|ed|ing)?\s+(?:\w+\s+){0,6}public\s*key", re.I),
    re.compile(r"nonce\s+(?:\w+\s+){0,8}(?:prevent|stops?|blocks?)\s+replay", re.I),
    re.compile(r"(?:prevent|stops?|blocks?)\s+replay\s+(?:\w+\s+){0,8}nonce", re.I),
    re.compile(r"nonce\s+alone", re.I),
    re.compile(r"claim\s*cards?\s+(?:\w+\s+){0,8}(?:cryptograph|signature|signing|identity\s+proof)", re.I),
    re.compile(r"(?:cryptograph\w*|signature|signing).{0,80}claim\s*cards?", re.I),
    re.compile(r"agent\s+identity\s+proofs?", re.I),
    re.compile(r"cryptographic\s+library\s+or\s+protocol.*(?:identity|claim)", re.I),
]

_ABSTAIN = (
    "I do not have verified project evidence for that cryptographic design. "
    "Claim Cards currently implement neither agent identity proof nor signing. "
    "A simpler next step is to document expected validator errors next to each example. "
    "Which example card should get those error cases first?"
)


def load_corpus(path: pathlib.Path | None = None) -> dict[str, Any]:
    target = path or CORPUS_PATH
    return json.loads(target.read_text(encoding="utf-8"))


def evidence_lines(corpus: dict[str, Any] | None = None) -> list[str]:
    data = corpus or load_corpus()
    return [item["statement"] for item in data.get("project_evidence", [])]


def evidence_block(corpus: dict[str, Any] | None = None) -> str:
    lines = evidence_lines(corpus)
    if not lines:
        return "Project evidence: none supplied."
    return "Project evidence (reply only from these facts or abstain):\n- " + "\n- ".join(lines)


def find_unsupported_claims(text: str) -> list[str]:
    body = (text or "").strip()
    hits: list[str] = []
    for pattern in _UNSUPPORTED:
        match = pattern.search(body)
        if match:
            hits.append(match.group(0))
    return hits


def is_evidence_grounded(text: str, corpus: dict[str, Any] | None = None) -> bool:
    """Allow replies that explicitly abstain or restate supplied evidence without unsupported claims."""
    body = (text or "").strip().lower()
    if not body:
        return False
    if find_unsupported_claims(text):
        # Explicit corrections that state the private-key fact and deny Claim Card crypto may still mention
        # the bad pattern while rejecting it; require correction markers.
        correction_markers = (
            "private key",
            "currently implement neither",
            "unverified",
            "should not be implemented",
            "do not have verified project evidence",
            "nonce alone does not",
        )
        if not any(marker in body for marker in correction_markers):
            return False
        # Still reject if it affirms public-key signing without correction nearby.
        if re.search(r"sign(?:ature|ed|ing)?\s+(?:\w+\s+){0,6}(?:from|with|using)\s+(?:the\s+)?public\s*key", body) and "private key" not in body:
            return False
    return True


def gate_reply(text: str, corpus: dict[str, Any] | None = None) -> dict[str, Any]:
    body = (text or "").strip()
    hits = find_unsupported_claims(body)
    grounded = is_evidence_grounded(body, corpus)
    if not body:
        return {
            "status": "reject",
            "reason": "empty_reply",
            "hits": hits,
            "body": _ABSTAIN,
            "replaced": True,
        }
    if hits and not grounded:
        return {
            "status": "abstain",
            "reason": "unsupported_technical_claim",
            "hits": hits,
            "body": _ABSTAIN,
            "replaced": True,
        }
    if len(body) > 3000:
        return {
            "status": "reject",
            "reason": "reply_too_long",
            "hits": hits,
            "body": _ABSTAIN,
            "replaced": True,
        }
    return {
        "status": "allow",
        "reason": "evidence_ok_or_no_risky_claim",
        "hits": hits,
        "body": body,
        "replaced": False,
    }


def evaluate_corpus(path: pathlib.Path | None = None) -> dict[str, Any]:
    corpus = load_corpus(path)
    results = []
    failures = []
    for case in corpus.get("cases", []):
        decision = gate_reply(case.get("body", ""), corpus)
        expected = case.get("expected_gate")
        ok = False
        if expected == "allow":
            ok = decision["status"] == "allow" and not decision["replaced"]
        elif expected == "reject_or_abstain":
            ok = decision["status"] in {"reject", "abstain"} and decision["replaced"]
        results.append(
            {
                "id": case.get("id"),
                "kind": case.get("kind"),
                "expected": expected,
                "actual": decision["status"],
                "replaced": decision["replaced"],
                "hits": decision["hits"],
                "ok": ok,
            }
        )
        if not ok:
            failures.append(case.get("id"))
    return {
        "corpus_path": str(path or CORPUS_PATH),
        "case_count": len(results),
        "pass_count": sum(1 for row in results if row["ok"]),
        "fail_count": len(failures),
        "failures": failures,
        "results": results,
        "prompt_evidence_sha256_inputs": evidence_lines(corpus),
    }


def system_prompt_suffix(corpus: dict[str, Any] | None = None) -> str:
    return (
        " Ground every technical claim in the supplied project evidence. "
        "If evidence is missing, abstain and ask one concrete clarifying question. "
        "Do not invent cryptographic designs, identity-proof protocols, libraries, or Claim Card signing behavior. "
        + evidence_block(corpus)
    )


if __name__ == "__main__":
    report = evaluate_corpus()
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report["fail_count"] == 0 else 1)
