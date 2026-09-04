#!/usr/bin/env python3
"""Strands agent entrypoint with a deterministic no-LLM trace."""
from __future__ import annotations

import argparse
import json
import os
from typing import Any, Optional

from cogram_tools import COGRAM_TOOLS, core_cogram_recall

SYSTEM_PROMPT = """You are an evidence-first coding assistant.

Use cogram_recall when a task resembles a prior fix or error. Cite returned
file:line evidence and distinguish evidence strength from certainty. Never
auto-apply a patch and never invent a result when Cogram returns a gap.
"""


def has_live_model_credentials() -> bool:
    if os.environ.get("STRANDS_DRY_RUN", "").lower() in {"1", "true", "yes"}:
        return False
    try:
        import strands  # noqa: F401
    except ImportError:
        return False
    return any(
        os.environ.get(name)
        for name in (
            "AWS_ACCESS_KEY_ID",
            "AWS_BEARER_TOKEN_BEDROCK",
            "OPENAI_API_KEY",
            "ANTHROPIC_API_KEY",
            "OLLAMA_HOST",
        )
    ) or os.environ.get("STRANDS_USE_OLLAMA", "").lower() in {"1", "true", "yes"}


def build_agent():
    from strands import Agent

    if os.environ.get("STRANDS_USE_OLLAMA", "").lower() in {"1", "true", "yes"}:
        from strands.models import OllamaModel

        model = OllamaModel(
            model_id=os.environ.get("STRANDS_OLLAMA_MODEL", "llama3.2"),
            host=os.environ.get("OLLAMA_HOST", "http://localhost:11434"),
        )
        return Agent(model=model, tools=COGRAM_TOOLS, system_prompt=SYSTEM_PROMPT, callback_handler=None)
    return Agent(tools=COGRAM_TOOLS, system_prompt=SYSTEM_PROMPT, callback_handler=None)


def run_dry_run(task: str, repo_scope: Optional[str] = None) -> str:
    """Show the same plan/retrieve/decide boundary without calling an LLM."""
    raw = core_cogram_recall(task, repo_scope=repo_scope, budget_tokens=500)
    data = json.loads(raw)
    recs = data.get("recommendations") or []
    lines = [
        "[STRANDS_DRY_RUN] deterministic agent trace",
        "  1. plan: inspect procedural memory before proposing a fix",
        "  2. tool: cogram_recall",
        f"     query: {task[:120]}",
    ]
    if recs:
        lines.append(f"  3. decide: use {len(recs)} bounded evidence item(s); do not auto-apply")
        lines.append(f"  4. cite: {recs[0].get('citation')}")
    else:
        lines.append("  3. decide: evidence gap; ask for more context instead of guessing")
    lines.append("  result: no patch applied")
    return "\n".join(lines)


def run_agent(task: str, repo_scope: Optional[str] = None) -> str:
    if not has_live_model_credentials():
        return run_dry_run(task, repo_scope=repo_scope)
    prompt = task if not repo_scope else f"Repo scope: {repo_scope}\n\n{task}"
    result = build_agent()(prompt)
    message: Any = getattr(result, "message", result)
    content = getattr(message, "content", message)
    if isinstance(content, list):
        return "\n".join(
            block.get("text", str(block)) if isinstance(block, dict) else str(block)
            for block in content
        )
    return str(content)


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Run the Strands + Cogram agent")
    parser.add_argument("task", nargs="?", default="Recall prior KeyError email fixes for src/user.py")
    parser.add_argument("--repo-scope", default="demo/strands-cogram")
    args = parser.parse_args(argv)
    print(run_agent(args.task, repo_scope=args.repo_scope))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
