from __future__ import annotations

import json

from _bootstrap import prepare_isolated_graph, read_fixture


def test_ingest_recall_preserves_source_path() -> None:
    prepare_isolated_graph("cogram_strands_test_")
    from cogram_tools import core_cogram_ingest_turn, core_cogram_recall

    ingest = json.loads(
        core_cogram_ingest_turn(
            read_fixture("completed_turn.txt"),
            repo_scope="demo/strands-cogram",
            source_path="src/user.py",
        )
    )
    assert ingest["source_path"] == "src/user.py"
    recall = json.loads(core_cogram_recall(read_fixture("recall_query.txt")))
    assert recall["recommendations"]
    assert recall["recommendations"][0]["citation"].startswith("src/user.py:")


def test_dry_run_exposes_decision_boundary() -> None:
    prepare_isolated_graph("cogram_strands_test_")
    from cogram_tools import core_cogram_ingest_turn
    from agent import run_dry_run

    core_cogram_ingest_turn(read_fixture("completed_turn.txt"), source_path="src/user.py")
    output = run_dry_run("KeyError email src/user.py", repo_scope="demo/strands-cogram")
    assert "cogram_recall" in output
    assert "no patch applied" in output
