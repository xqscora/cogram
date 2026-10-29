# Cogram Web Demo

Static visualization of **Cogram**, a zero-LLM concept-network memory for coding agents. The current export is a capped subset of a graph built from 600 public SWE-agent trajectories: 86 concepts, 192 edges, and 1,166 source lines. The page loads its local assets over HTTP; it makes no inference API calls.

## Quick start

```bash
cd docs
python -m http.server 8000
```

Open **http://localhost:8000**

## What you see

| Control | Behavior |
|---------|----------|
| **Recall query** | Tokenize → seed concepts → 2-hop activation spread with edge pulse animation |
| **Tick slider** | Forward decay scenario on a fixed snapshot, not historical replay or online learning |
| **Provenance** | IDF/relevance-ranked exported source pointers; not a guarantee of a correct fix |
| **Archived example** | Fixed dacite issue/investigation excerpts, explicitly separate from query results |
| **Token counter** | Actual returned payload estimated as characters/4; corpus size is not a per-query saving |

## Files

| File | Purpose |
|------|---------|
| `build_web_graph_swe.py` | Builds the current SWE subset (requires the full source graph/corpus) |
| `build_web_graph.py` | Legacy LongMemEval export builder, not the current demo data |
| `graph.json` | Exported nodes, edges, lines, pointers, meta |
| `index.html` / `app.js` / `style.css` | Static demo UI |
| `recall.js` / `recall.test.js` | Production retrieval helpers and Node regression tests |
| `vendor/cytoscape.min.js` | Local Cytoscape (no CDN at runtime) |

## Data

- Current builder: `python docs/build_web_graph_swe.py` from the repository root, after preparing `swe_concept_graph.json` and `swe_corpus/`.
- Export selection uses surprise mass, per-node edge caps, and pinned demo-query terms. This is not an unselected held-out evaluation.
- Browser retrieval uses exact-identifier-first seeds, two-hop propagation and the Python SWE path's IDF/relevance factors. It does not have the full graph, and retains the strongest support per source line rather than Python's legacy first-pointer-wins iteration. Do not claim identical output to the full CLI.
- Source text is displayed verbatim (with visual truncation). The source may describe an issue or an investigation, not a completed fix.

## Benchmark caption

The footer's historical numbers match `../benchmark_longmem_results.md` (Round 3, n=48): BM25 and Cogram+BM25 28/48, full-context 17/48; average contexts 1,993 / 1,992 / 89,469 tokens. The full-context arm used mixed truncation caps. These are not measurements of this browser implementation. No new answer-quality benchmark was run for the browser fix.

## Regression checks

```bash
node --test docs/recall.test.js
```

Tests exercise the same module loaded by the page, including three known-project top-source smoke checks, unknown queries, compound identifiers, IDF, preservation of exact seeds, and payload estimates. They do not prove generalization or fix correctness. Browser verification must also cover query edits, empty results, the decay control, desktop/mobile layout and nonblank graph rendering.

## Zero LLM

Graph construction uses statistical tokenization and co-occurrence (`graph_lib.py`). No embeddings, summarization, or inference API calls are made by this static demo.
