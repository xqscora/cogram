# Cogram — Procedural Memory for Coding Agents

Coding agents (SWE-agent, OpenHands, Claude Code, Cursor, etc.) don't remember what they did last week. Every run starts cold, so the same bug gets re-diagnosed and the same fix gets re-derived over and over. The usual workaround is stuffing old transcripts back into the context window, which is slow, expensive, and still degrades once the history gets long.

Cogram is a small memory layer that sits on top of an agent's own past transcripts (reasoning → command → error → fix → patch) and turns them into a concept graph, with every concept pointing back to the exact file and line it came from. Building the graph costs **zero LLM tokens** — it's built with statistics (co-occurrence + a novelty/surprise signal), not with an LLM summarizing anything. Recalling from it later costs on the order of **~200 tokens** instead of thousands.

Old, unused parts of the graph fade over time (measured in "ticks" — actual agent interactions, not wall-clock time, so memory doesn't decay just because the agent was idle) but nothing is ever fully deleted. A fix that hasn't been touched in months can still be found; it just has to be "re-lit" by being relevant again.

## What's in this repo

| File / folder | What it does |
|---|---|
| `extract_swe.py`, `fetch_swe.py`, `swe_to_transcripts.py` | Build the concept graph from a slice of public SWE-agent trajectories |
| `graph_lib.py` | Core graph math: edge weights, tick-based decay, tokenization |
| `recall.py` | Zero-LLM retrieval: given a query, walk the graph and return the most relevant lines |
| `learn.py` | Online learning — reinforces known concepts, creates new ones as they show up |
| `memory_api.py` | Agent-facing API: `recommend()` and `end_turn()`, meant to be called from inside an agent loop |
| `swe_recall_demo.py` | Runnable demo — shows a new problem being recalled against the past-fix graph |
| `benchmark_longmem.py`, `benchmark_qa.py`, `benchmark_bakeoff.py`, `benchmark_budget_sweep.py` | Benchmarks against BM25 and full-context baselines (see results below) |
| `web/` | Interactive graph visualization (concept map + query trace) |
| `migrations/` | SQL schema for optional cloud persistence via InsForge |

## Try it

```bash
pip install -r requirements.txt   # tiktoken, jieba, pyarrow, requests
python fetch_swe.py               # downloads a slice of nebius/SWE-agent-trajectories (CC-BY 4.0)
python swe_to_transcripts.py      # converts it to line-based transcripts
python extract_swe.py             # builds the concept graph, zero LLM tokens
python swe_recall_demo.py         # asks a new question, shows what it recalls and from where
```

`extract.py`, `recall.py`, and `memory_api.py` default to reading from `swe_corpus/` (the public data above). To point them at your own agent's transcripts instead, set `ENGRAM_TRANSCRIPT_DIR` to your transcript folder. (Internally the code still says "engram" in places — that's just the original working name; the project is now called Cogram.)

## Results, briefly

- 600 real SWE-agent trajectories, 184k lines, ~2.5M tokens → concept graph is 4.5x smaller than the raw text, and costs 0 LLM tokens to build.
- Recalling a fix for a new problem costs ~150–280 tokens and points to the exact `file:line` of the original fix — about 7,000–17,000x smaller than re-reading the whole history.
- On LongMemEval (ICLR 2025, a standard long-term conversational memory benchmark, not our home turf), a BM25-ranked version of this graph ties the best lexical retriever on accuracy at ~45x fewer tokens. Full numbers in `benchmark_longmem_results.md` and `benchmark_budget_sweep_results.md` — including where it does *not* win, we left that in.

## License

CC BY-NC-SA 4.0 — free to use, run, and modify for personal or research use, with attribution, as long as anything you build on top of it stays open under the same terms. Not for commercial use without asking first. See `LICENSE`.

## Author

Built by Cora Zeng ([@xqscora](https://github.com/xqscora)) for AGI Summit 2026 Hackathon.
