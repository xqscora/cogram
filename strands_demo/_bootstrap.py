"""Small, isolated runtime helpers for the public Strands demo."""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

DEMO_ROOT = Path(__file__).resolve().parent
REPO_ROOT = DEMO_ROOT.parent
FIXTURES_DIR = DEMO_ROOT / "fixtures"


def setup_cogram(*, graph_path: str | None = None, transcript_root: str | None = None) -> None:
    """Point Cogram at a disposable graph before importing ``memory_api``."""
    repo = str(REPO_ROOT)
    if repo not in sys.path:
        sys.path.insert(0, repo)
    if graph_path:
        os.environ["COGRAM_GRAPH"] = graph_path
    if transcript_root:
        os.environ["ENGRAM_TRANSCRIPT_DIR"] = transcript_root
        Path(transcript_root).mkdir(parents=True, exist_ok=True)


def prepare_isolated_graph(prefix: str = "cogram_strands_") -> tuple[str, str]:
    """Create an isolated graph + transcript root for one demo/test run."""
    temp_root = Path(tempfile.mkdtemp(prefix=prefix))
    graph_path = temp_root / "concept_graph.json"
    transcript_root = temp_root / "transcripts"
    setup_cogram(graph_path=str(graph_path), transcript_root=str(transcript_root))
    return str(graph_path), str(transcript_root)


def write_source(source_path: str, text: str) -> Path:
    """Write only a safe relative provenance file into the demo transcript root."""
    root = Path(os.environ["ENGRAM_TRANSCRIPT_DIR"]).resolve()
    relative = Path(source_path)
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError("source_path must stay inside the transcript root")
    target = (root / relative).resolve()
    if root not in target.parents and target != root:
        raise ValueError("source_path escaped the transcript root")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text.rstrip() + "\n", encoding="utf-8")
    return target


def read_fixture(name: str) -> str:
    return (FIXTURES_DIR / name).read_text(encoding="utf-8").strip()
