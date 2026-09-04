"""Strands tools over Cogram's real zero-LLM memory API."""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from _bootstrap import write_source

from memory_api import end_turn, recommend

try:
    from strands import tool
except ImportError:  # pragma: no cover - offline smoke tests use core functions

    def tool(*_args, **_kwargs):  # type: ignore[misc]
        def decorator(fn):
            return fn

        if _args and callable(_args[0]):
            return _args[0]
        return decorator


def _format_recall_payload(result: dict, repo_scope: Optional[str]) -> str:
    rows = []
    for rec in result.get("recommendations") or []:
        session = rec.get("session") or ""
        line_idx = rec.get("line_idx")
        source_path = session
        citation = f"{source_path}:{line_idx}" if line_idx else source_path
        rows.append(
            {
                "citation": citation,
                "text": rec.get("text"),
                "strength": rec.get("strength"),
                "path": rec.get("path"),
                "line_idx": line_idx,
            }
        )
    return json.dumps(
        {
            "repo_scope": repo_scope,
            "recommendations": rows,
            "routes": result.get("routes") or [],
            "gaps": result.get("gaps") or [],
            "stats": result.get("stats") or {},
            "evidence_note": "strength is a ranking signal, not a probability",
        },
        ensure_ascii=False,
        indent=2,
    )


def core_cogram_recall(
    query: str,
    repo_scope: Optional[str] = None,
    budget_tokens: int = 500,
) -> str:
    """Return bounded, auditable Cogram evidence for a task."""
    return _format_recall_payload(
        recommend(query, budget_tokens=budget_tokens),
        repo_scope,
    )


def core_cogram_ingest_turn(
    turn_text: str,
    repo_scope: Optional[str] = None,
    source_path: Optional[str] = None,
    task: Optional[str] = None,
) -> str:
    """Learn a completed turn and preserve its source path for later recall."""
    chosen_source = source_path or "demo/turn.txt"
    result = end_turn(turn_text, sync=False, source_path=chosen_source)
    write_source(chosen_source, turn_text)
    return json.dumps(
        {
            "tick": result.get("tick"),
            "source_path": result.get("source_path", chosen_source),
            "repo_scope": repo_scope,
            "task": task,
            "new_concepts": result.get("new_concepts"),
            "reinforced_edges": result.get("reinforced_edges"),
            "closed_gaps": result.get("closed_gaps"),
        },
        ensure_ascii=False,
        indent=2,
    )


@tool(
    name="cogram_recall",
    description=(
        "Recall ranked procedural memories for a coding task or error. "
        "Return bounded file:line evidence; never invent a fix."
    ),
)
def cogram_recall(
    query: str,
    repo_scope: Optional[str] = None,
    budget_tokens: int = 500,
) -> str:
    return core_cogram_recall(query, repo_scope=repo_scope, budget_tokens=budget_tokens)


@tool(
    name="cogram_ingest_turn",
    description="Ingest a completed agent turn and preserve its provenance for future recall.",
)
def cogram_ingest_turn(
    turn_text: str,
    repo_scope: Optional[str] = None,
    source_path: Optional[str] = None,
    task: Optional[str] = None,
) -> str:
    return core_cogram_ingest_turn(
        turn_text,
        repo_scope=repo_scope,
        source_path=source_path,
        task=task,
    )


COGRAM_TOOLS = [cogram_recall, cogram_ingest_turn]
