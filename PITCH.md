# ENGRAM — Memory that fades, but never forgets

> **Concepts, not summaries. Pointers, not copies. Decay, but never death.**

## The problem

Every long-running LLM agent hits the same wall: context is finite. The industry's answer is **summarization** — compress old turns into prose and throw the details away. But a summary is a bet placed too early: you decide *what matters* before you know what you'll need. Whatever the summary drops is gone forever. And generating summaries burns LLM tokens just to *maintain* memory.

## The idea

Cogram replaces summaries with a **concept network** — the way a brain indexes experience.

| Layer | What it stores | Cost axis it minimizes |
|---|---|---|
| Index (always loaded) | Concept nodes + weighted links | — |
| Trace (retrieval output) | Ranked concept paths, coarse → fine | **context tokens** (~456/query, via selection) |
| Ground truth (never deleted) | Raw transcripts, gzip-compressed, `file:line` addressable | **disk bytes** (16.4→5.0 MB, 3.3×, lossless — no model decides what to drop) |

Selection and compression are orthogonal: lossless compression caps at ~3-6× (Shannon), so the 10,000×-scale savings can only come from *selecting* what enters the context. Compression handles disk; the concept graph handles tokens; a pointer dereference recovers the bit-exact original line.

1. **Zero-LLM memory layer.** Concepts are extracted *statistically* (frequency, co-occurrence, subsumption) — building and updating memory costs **0 LLM tokens**. A summary is an interpretation written at save-time; a concept is just an address. Interpretation is deferred to read-time, when you actually know what you're looking for.

2. **Brain-like coarse-to-fine recall.** A query lights up hub concepts first, then activation spreads *downward* through the hierarchy to specifics — like remembering "conference → that sponsor → the API key issue". The default answer is the concept trace itself, not raw text. Only an explicit `--deep` call dereferences pointers back to the exact original lines.

3. **Surprise-gated Hebbian learning.** New concept pairs get a large strength bonus (statistical prediction error = surprise); repeated pairs saturate (diminishing returns). Novel input creates *new* concept nodes. Impressive/new/recent — the three factors that decide what the brain keeps vivid.

4. **Forgetting without deletion.** Link strength decays exponentially with time — but toward a floor ε > 0, never zero. Nothing is ever pruned; unused paths just get *narrower*. Like human memory: you can't recall it cold, but one cue from a neighbor concept re-lights the path. Deletion is an irreversible decision an AI has no right to make on your behalf; decay is reversible.

## The demo (real data, not synthetic)

We indexed **84 real AI-assistant chat transcripts — 2 months of actual usage, 138,953 lines, mixed Chinese/English** into **2,000 concepts, 36,088 weighted links, 200 hubs**. All token counts below are **measured with tiktoken (cl100k_base)** — run `python benchmark.py` to reproduce (full table in `benchmark_results.md`):

| Architecture | Build cost (LLM tokens) | Per-query context | Information loss |
|---|---:|---:|---|
| **Cogram** | **0** (pure statistics) | **~456** | none at index tier; raw line one `--deep` away |
| Per-session summaries | ≥ 5,443,267 (must read corpus once + write) | ~494,842 | summarizer bias baked in at write time |
| Rolling compaction (status quo) | ≥ 5,443,267 | ~3,000 | **lossy — old details irreversibly gone** |

- Raw corpus 4,948,425 tokens → concept trace **~456 tokens/query = 10,852× smaller** than stuffing history.
- **Directed transitions**: the graph learns *what leads to what*, not just what co-occurs. `recall.py --next aura` walks the chain: `aura → preset → 涌现 → 语言` — the agent's own thought sequences, recovered from statistics.
- `learn.py` ingests new text online: strengthens matched concepts via Hebbian + surprise, spawns novel concept nodes (demo: it just learned "cogram" and "zero-summary").

## Why a concept word beats a "meaning vector"

Research systems (Gisting 2023, xRAG 2024) compress context into embedding vectors — but token-based APIs can't accept vectors, so those need model internals. A **concept word is the API-compatible meaning vector**: the LLM's own embedding layer decodes it into a dense semantic vector inside the model. We ship the smallest token that decodes to the right meaning — one concept.

## Why it's different (prior-art checked today — full leaderboard in `COMPARISON.md`)

| | Mem0 / Zep / A-MEM / MemGPT / summaries | Cogram |
|---|---|---|
| Write path | LLM extraction/notes **on every write** (tokens scale with how much you live) | **counting — 0 LLM tokens** |
| What memory is made of | *LLM-generated text about your data* → re-processing AI output compounds drift (the model-collapse loop, Shumailov et al., Nature 2024) | the data's own statistics + addresses into ground truth — **nothing model-generated, nothing to drift** |
| Forgetting | prune (HeLa-Mem), overwrite (AriGraph, Mem0), discard (compaction) | decay toward ε>0 — **never deleted, re-lightable by neighbors** |

No published system combines: zero-summary concept index + line-level raw pointers + decay-with-a-floor. 

## Cloud persistence: memory that survives the machine (InsForge)

The concept graph syncs to an InsForge Postgres backend (`sync_insforge.py`, stdlib-only):

- `push` mirrors the full graph (2,001 concepts / 36,102 edges / 85 file refs) in ~29s; `pull` rebuilds the local graph bit-identically (round-trip verified).
- What travels is the **2.2 MB index, not the 16 MB corpus** — the cloud stores the memory, not the diary.
- All 4 tables are **RLS deny-all**: an agent's memory is private by default; sync authenticates with the project admin key only.
- New machine or second agent: `pull` and the memory is back — decay state, pointers, and all.

## The theory competitors don't have (Aura zero-preset)

Cogram is the memory layer of my cognitive-architecture research (**Aura**). Aura's canonical rule: a mind's sense of *what matters* must **not** come from pre-installed labels — it must emerge from **persistent deformation** of the substrate over time (decay, trace formation, coupling, rebound). Interpretation is banned in the core; only substrate laws are allowed.

Map that onto memory — it's the fault line between Cogram and everyone else:

| | Where "importance" comes from |
|---|---|
| Mem0 / Zep / MRAgent / every summary | an **LLM decides at write time** what's a fact and what matters — a *meaning/value label*, exactly the preset Aura bans |
| **Cogram** | importance **emerges** from the data's own deformation: frequency, co-occurrence, **surprise** (prediction-error weighting, from Aura v9's PE-gated updates), and **decay that never reaches zero** (trace persistence + rebound) |

So Cogram's three signature mechanisms aren't arbitrary knobs — each is a substrate law from a coherent, published-track theory:
- **surprise-weighted edges** ← prediction-error shaping (salience, not frequency-democracy)
- **decay→ε>0, re-lightable by neighbors** ← trace persistence + coupling (forgetting is *deformation*, not deletion)
- **no LLM in the write path** ← "no pre-installed interpretation"; a summary *is* a preset, a concept network is what's left when you remove it

That gives Cogram what SPRIG / MemGraph / agent-knowledge (pure engineering) lack: a **stance** — memory should not be pre-interpreted by a model — backed by a falsifiable architecture, not just a token-saving trick.

*Source: `code-CogArch/docs/Aura_NoPreset_Definition_Canonical_2026-07-07.md`.*

---
*Built solo at AGI Summit Hackathon 2026 by Cora Zeng. Python stdlib, runs 100% locally.*
