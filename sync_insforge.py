#!/usr/bin/env python3
"""Sync local concept_graph.json to/from InsForge (PostgREST-style API)."""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_JSON = os.path.join(SCRIPT_DIR, ".insforge", "project.json")
BATCH_SIZE = 500
PAGE_SIZE = 1000

from graph_lib import GRAPH_PATH, load_graph, save_graph  # noqa: E402


def load_credentials() -> Tuple[str, str]:
    with open(PROJECT_JSON, encoding="utf-8") as f:
        cfg = json.load(f)
    api_key = cfg["api_key"]
    oss_host = cfg["oss_host"].rstrip("/")
    return api_key, oss_host


def _request(
    method: str,
    url: str,
    api_key: str,
    body: Optional[bytes] = None,
    extra_headers: Optional[Dict[str, str]] = None,
) -> Tuple[int, Dict[str, str], bytes]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }
    if body is not None:
        headers["Content-Type"] = "application/json"
    if extra_headers:
        headers.update(extra_headers)

    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    last_err: Optional[BaseException] = None
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                return resp.status, dict(resp.headers.items()), resp.read()
        except urllib.error.HTTPError as e:
            err_body = e.read()
            if e.code >= 500 and attempt == 0:
                last_err = e
                time.sleep(1.0)
                continue
            text = err_body.decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code} {method} {url}\n{text}") from e
        except urllib.error.URLError as e:
            if attempt == 0:
                last_err = e
                time.sleep(1.0)
                continue
            raise RuntimeError(f"URLError {method} {url}: {e}") from e

    raise RuntimeError(f"Request failed after retry: {method} {url}") from last_err


def api_url(oss_host: str, table: str, query: str = "") -> str:
    base = f"{oss_host}/api/database/records/{table}"
    return f"{base}?{query}" if query else base


def delete_all(api_key: str, oss_host: str, table: str, pk_col: str) -> None:
    url = api_url(oss_host, table, f"{pk_col}=not.is.null")
    _request("DELETE", url, api_key)
    print(f"  deleted all rows from {table}")


def upsert_batch(
    api_key: str,
    oss_host: str,
    table: str,
    rows: List[dict],
) -> None:
    if not rows:
        return
    url = api_url(oss_host, table)
    body = json.dumps(rows, ensure_ascii=False).encode("utf-8")
    _request(
        "POST",
        url,
        api_key,
        body=body,
        extra_headers={"Prefer": "resolution=merge-duplicates"},
    )


def push_batches(
    api_key: str,
    oss_host: str,
    table: str,
    rows: List[dict],
) -> int:
    total = len(rows)
    if total == 0:
        print(f"pushed {table} 0 rows in 0 batches")
        return 0
    batches = 0
    for i in range(0, total, BATCH_SIZE):
        upsert_batch(api_key, oss_host, table, rows[i : i + BATCH_SIZE])
        batches += 1
    print(f"pushed {table} {total} rows in {batches} batches")
    return batches


def count_rows(api_key: str, oss_host: str, table: str) -> int:
    url = api_url(oss_host, table, "limit=1")
    status, headers, _ = _request(
        "GET",
        url,
        api_key,
        extra_headers={"Prefer": "count=exact"},
    )
    if status not in (200, 206):
        raise RuntimeError(f"count failed for {table}: HTTP {status}")
    total = headers.get("X-Total-Count") or headers.get("content-range", "").split("/")[-1]
    if not total or total == "*":
        return 0
    return int(total)


def fetch_all(api_key: str, oss_host: str, table: str) -> List[dict]:
    rows: List[dict] = []
    offset = 0
    while True:
        url = api_url(oss_host, table, f"limit={PAGE_SIZE}&offset={offset}")
        status, _, body = _request("GET", url, api_key)
        if status != 200:
            raise RuntimeError(f"fetch failed for {table}: HTTP {status}")
        page = json.loads(body.decode("utf-8"))
        if not page:
            break
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def graph_to_rows(graph: dict) -> Tuple[List[dict], List[dict], List[dict], List[dict]]:
    meta = graph.get("meta", {})
    files = meta.get("files", [])

    file_rows = [{"id": i, "name": fname} for i, fname in enumerate(files)]

    concept_rows: List[dict] = []
    for name, node in graph.get("nodes", {}).items():
        concept_rows.append(
            {
                "name": name,
                "count": node.get("count", 0),
                "df": node.get("df", 0),
                "first_seen": node.get("first_seen"),
                "last_seen": node.get("last_seen"),
                "hub": bool(node.get("hub", False)),
                "generality": float(node.get("generality", 0.0)),
                "parents": node.get("parents", []),
                "next": node.get("next", []),
                "pointers": node.get("pointers", []),
            }
        )

    edge_rows: List[dict] = []
    for e in graph.get("edges", []):
        if len(e) < 4:
            continue
        edge_rows.append(
            {
                "a": e[0],
                "b": e[1],
                "w_raw": float(e[2]),
                "last_seen": e[3],
            }
        )

    meta_rows: List[dict] = []
    for key, value in meta.items():
        if key == "files":
            continue
        meta_rows.append({"key": key, "value": value})

    return file_rows, concept_rows, edge_rows, meta_rows


def rows_to_graph(
    file_rows: List[dict],
    concept_rows: List[dict],
    edge_rows: List[dict],
    meta_rows: List[dict],
) -> dict:
    file_rows_sorted = sorted(file_rows, key=lambda r: r["id"])
    files = [r["name"] for r in file_rows_sorted]

    nodes: Dict[str, dict] = {}
    for row in concept_rows:
        name = row["name"]
        nodes[name] = {
            "count": row.get("count", 0),
            "df": row.get("df", 0),
            "first_seen": row.get("first_seen"),
            "last_seen": row.get("last_seen"),
            "pointers": row.get("pointers") or [],
            "parents": row.get("parents") or [],
            "hub": bool(row.get("hub", False)),
            "generality": row.get("generality", 0.0),
            "next": row.get("next") or [],
        }

    edges: List[list] = []
    for row in edge_rows:
        edges.append([row["a"], row["b"], row["w_raw"], row.get("last_seen")])

    meta: Dict[str, Any] = {row["key"]: row["value"] for row in meta_rows}
    meta["files"] = files

    return {"nodes": nodes, "edges": edges, "meta": meta}


def local_counts(graph: dict) -> Dict[str, int]:
    meta = graph.get("meta", {})
    meta_keys = [k for k in meta.keys() if k != "files"]
    return {
        "engram_files": len(meta.get("files", [])),
        "engram_concepts": len(graph.get("nodes", {})),
        "engram_edges": len(graph.get("edges", [])),
        "engram_meta": len(meta_keys),
    }


def cmd_push(api_key: str, oss_host: str, replace: bool) -> None:
    graph = load_graph()
    file_rows, concept_rows, edge_rows, meta_rows = graph_to_rows(graph)

    t0 = time.perf_counter()
    if replace:
        print("replace: deleting remote rows...")
        delete_all(api_key, oss_host, "engram_edges", "a")
        delete_all(api_key, oss_host, "engram_concepts", "name")
        delete_all(api_key, oss_host, "engram_files", "id")
        delete_all(api_key, oss_host, "engram_meta", "key")

    push_batches(api_key, oss_host, "engram_files", file_rows)
    push_batches(api_key, oss_host, "engram_concepts", concept_rows)
    push_batches(api_key, oss_host, "engram_edges", edge_rows)
    push_batches(api_key, oss_host, "engram_meta", meta_rows)

    elapsed = time.perf_counter() - t0
    print(f"push complete in {elapsed:.1f}s")


def cmd_pull(api_key: str, oss_host: str, out_path: str) -> None:
    t0 = time.perf_counter()
    file_rows = fetch_all(api_key, oss_host, "engram_files")
    concept_rows = fetch_all(api_key, oss_host, "engram_concepts")
    edge_rows = fetch_all(api_key, oss_host, "engram_edges")
    meta_rows = fetch_all(api_key, oss_host, "engram_meta")

    graph = rows_to_graph(file_rows, concept_rows, edge_rows, meta_rows)
    save_graph(graph, out_path)
    elapsed = time.perf_counter() - t0
    print(
        f"pulled {len(concept_rows)} concepts, {len(edge_rows)} edges, "
        f"{len(file_rows)} files -> {out_path} ({elapsed:.1f}s)"
    )


def cmd_status(api_key: str, oss_host: str) -> None:
    graph = load_graph()
    local = local_counts(graph)
    print(f"{'table':<20} {'local':>8} {'remote':>8}")
    print("-" * 40)
    for table in ("engram_files", "engram_concepts", "engram_edges", "engram_meta"):
        remote = count_rows(api_key, oss_host, table)
        print(f"{table:<20} {local[table]:>8} {remote:>8}")


def compare_graphs(local: dict, pulled: dict) -> None:
    ln = len(local.get("nodes", {}))
    pn = len(pulled.get("nodes", {}))
    le = len(local.get("edges", []))
    pe = len(pulled.get("edges", []))
    print(f"node count: local={ln} pulled={pn} match={ln == pn}")
    print(f"edge count: local={le} pulled={pe} match={le == pe}")

    spot = "aura"
    lnode = local.get("nodes", {}).get(spot)
    pnode = pulled.get("nodes", {}).get(spot)
    if lnode and pnode:
        count_ok = lnode.get("count") == pnode.get("count")
        ptr_ok = lnode.get("pointers") == pnode.get("pointers")
        print(f"spot-check '{spot}': count match={count_ok}, pointers match={ptr_ok}")
        if not count_ok:
            print(f"  local count={lnode.get('count')} pulled count={pnode.get('count')}")
    else:
        print(f"spot-check '{spot}': missing in one graph")

    ok = ln == pn and le == pe and lnode and pnode and (
        lnode.get("count") == pnode.get("count")
        and lnode.get("pointers") == pnode.get("pointers")
    )
    print("round-trip verification:", "PASS" if ok else "FAIL")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync concept graph with InsForge")
    sub = parser.add_subparsers(dest="command", required=True)

    p_push = sub.add_parser("push", help="Upsert local graph to InsForge")
    p_push.add_argument(
        "--replace",
        action="store_true",
        help="Delete all remote rows before push",
    )

    p_pull = sub.add_parser("pull", help="Download remote graph to JSON")
    p_pull.add_argument(
        "--out",
        default="concept_graph.pulled.json",
        help="Output path (default: concept_graph.pulled.json)",
    )

    sub.add_parser("status", help="Compare local vs remote row counts")

    args = parser.parse_args()
    api_key, oss_host = load_credentials()

    if args.command == "push":
        cmd_push(api_key, oss_host, args.replace)
    elif args.command == "pull":
        out = args.out
        if not os.path.isabs(out):
            out = os.path.join(SCRIPT_DIR, out)
        cmd_pull(api_key, oss_host, out)
    elif args.command == "status":
        cmd_status(api_key, oss_host)
    else:
        parser.error(f"unknown command: {args.command}")


if __name__ == "__main__":
    main()
