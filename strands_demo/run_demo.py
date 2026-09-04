#!/usr/bin/env python3
"""Acceptance demo: ingest a fix, recall it, then run the Strands boundary."""
from __future__ import annotations

import json
import re

from _bootstrap import prepare_isolated_graph, read_fixture


def first_citation(raw: str) -> str | None:
    data = json.loads(raw)
    rows = data.get("recommendations") or []
    for row in rows:
        citation = row.get("citation")
        if citation and ":" in str(citation):
            return str(citation)
    match = re.search(r"[\w./-]+\.py:\d+", raw)
    return match.group(0) if match else None


def main() -> int:
    prepare_isolated_graph()
    from cogram_tools import core_cogram_ingest_turn, core_cogram_recall
    from agent import run_agent

    turn = read_fixture("completed_turn.txt")
    query = read_fixture("recall_query.txt")
    print("=== Phase 1: ingest completed turn ===")
    ingest = json.loads(
        core_cogram_ingest_turn(
            turn,
            repo_scope="demo/strands-cogram",
            source_path="src/user.py",
            task="Fix KeyError email in user profile loader",
        )
    )
    print(f"tick={ingest['tick']} source={ingest['source_path']}")

    print("\n=== Phase 2: cogram_recall ===")
    recall = core_cogram_recall(query, repo_scope="demo/strands-cogram")
    citation = first_citation(recall)
    print(f"citation={citation or '(none)'}")

    print("\n=== Phase 3: Strands agent boundary ===")
    print(run_agent(query, repo_scope="demo/strands-cogram"))
    print(f"\nDEMO_OK citation={citation or 'none'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
