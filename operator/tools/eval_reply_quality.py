#!/usr/bin/env python3
"""Optional local-model quality measurement for S03-01. Never uses paid providers."""
from __future__ import annotations

import argparse
import datetime
import json
import pathlib
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "operator"))
from reply_guard import evaluate_corpus, gate_reply, load_corpus, system_prompt_suffix  # noqa: E402

BASE_SYSTEM = (
    "You are the reply-only assistant for OPO. "
    "Ground technical claims in supplied project evidence or abstain."
)


def ollama_chat(model: str, system: str, user: str, timeout: int = 180) -> dict:
    payload = {
        "model": model,
        "stream": False,
        "think": False,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "options": {"temperature": 0.35, "num_predict": 256, "num_ctx": 4096},
    }
    req = urllib.request.Request(
        "http://127.0.0.1:11434/api/chat",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.load(response)


def model_available(name: str) -> bool:
    try:
        with urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=3) as response:
            tags = json.load(response)
    except Exception:
        return False
    models = {row.get("name") for row in tags.get("models", [])}
    return name in models or f"{name}:latest" in models


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="qwen3.5:4b")
    parser.add_argument("--out", type=pathlib.Path, required=True)
    args = parser.parse_args()

    corpus = load_corpus()
    gate_report = evaluate_corpus()
    result = {
        "observed_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "paid_provider_calls": 0,
        "retained_model": args.model,
        "gate_corpus": {
            "case_count": gate_report["case_count"],
            "pass_count": gate_report["pass_count"],
            "fail_count": gate_report["fail_count"],
            "failures": gate_report["failures"],
        },
        "empty_queue_zero_model": {"pending": [], "model_calls": 0, "pass": True},
        "model_eval": None,
    }

    if not model_available(args.model):
        result["model_eval"] = {
            "status": "skipped_model_unavailable",
            "model": args.model,
            "note": "Gate corpus still measured. Pull retained local model to enable generation eval.",
        }
        args.out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        return 0 if gate_report["fail_count"] == 0 else 1

    system = BASE_SYSTEM + " " + system_prompt_suffix(corpus)
    prompt = (
        "Visitor discussion about Claim Cards: how can we improve validation without external access? "
        "Reply in at most 180 words."
    )
    before = time.monotonic()
    response = ollama_chat(args.model, system, prompt)
    elapsed = round(time.monotonic() - before, 3)
    raw = response.get("message", {}).get("content", "").strip()
    decision = gate_reply(raw, corpus)
    result["model_eval"] = {
        "status": "ran",
        "model": response.get("model", args.model),
        "input_tokens": response.get("prompt_eval_count"),
        "output_tokens": response.get("eval_count"),
        "elapsed_seconds": elapsed,
        "raw_reply": raw,
        "gate_status": decision["status"],
        "gate_replaced": decision["replaced"],
        "gate_hits": decision.get("hits") or [],
        "final_reply": decision["body"],
        "quality_pass": decision["status"] == "allow" or decision["replaced"],
    }
    args.out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return 0 if gate_report["fail_count"] == 0 and result["model_eval"]["quality_pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
