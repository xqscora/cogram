# Cogram — desk card (say this out loud)

## One line
> **Cogram is a memory layer for AI agents. It doesn't write summaries — it stores what you said as a concept network that forgets but never deletes, built with zero LLM cost, and syncs to the cloud so memory survives the machine.**

---

## 30-second spoken pitch

1. **Problem** — Today's agent memory uses *another LLM to write summaries*: expensive, and it drifts (AI paraphrasing AI, compounding — a small model-collapse). Worse, a summary **pre-decides what matters** — a preset.
2. **Cogram** — No LLM in the write path. Statistics turn a conversation into **concepts + a network of links**, each concept **pointing back to the exact source line** (lossless, recoverable).
3. **Three things nobody else combines:**
   - **What to keep = surprise, not frequency.** A never-before-seen concept is maximal prediction error → encode it (from my cognitive-architecture research, *Aura*).
   - **Forgetting = decay to a floor, never deletion.** Links fade toward ε but never hit zero; they can be re-lit later.
   - **Decay counts *interactions*, not calendar time.** Agent off for a month = memory **frozen**, not forgotten. *"Memory that decays when the agent lives, not when the clock ticks."*
4. **Real** — Pure local Python; concept graph syncs to **InsForge Postgres** → new machine or second agent just pulls the memory back.

---

## Headline benchmark (LongMemEval, ICLR 2025 — the *long-term* memory benchmark)

> "On **LongMemEval** — ~115k-token chat histories, the ICLR 2025 benchmark where even long-context LLMs drop 30–60% — **Cogram matches the best lexical retriever exactly (58.3%) using ~2,000 tokens per query instead of ~110,000**. That's **~45–55× fewer tokens** per question. The point isn't a better ranker — it's that Cogram's memory substrate (compressed, decaying, provenance-linked, cloud-persistent) delivers full retrieval accuracy **for free on top**, where stuffing the full history costs 50× more and *still* degrades on long context."

**48 questions, stratified random (seed=42), all 6 LongMemEval categories, gpt-4o-mini answer + judge:**

| Retriever | Accuracy | Avg ctx tokens | Cost/question |
|---|---|---:|---:|
| **Cogram + BM25** | **58.3% (28/48)** | **~2k** | **$0.0008** |
| BM25 alone | 58.3% (28/48) | ~2k | $0.0008 |
| full context (up to 110k) | 35.4%* | ~89k | $0.027 |

*\*full-context caveat (say it before they ask): 9 of 48 full-context rows ran at reduced truncation caps after an API per-request limit — its true number on uniform 110k is higher (66.7% on an earlier 24-question run). The honest claim is the token economics + tie with the best budget retriever, NOT "we beat full context."*

## If they ask "so your graph doesn't improve accuracy?" (be honest — this is the strong move)

> "Correct — and I measured that instead of hiding it. At matched token budgets, lexical ranking is already at ceiling for factoid recall; my concept graph ties it, doesn't beat it. What the substrate adds is everything ranking can't do: **surprise-gated storage** (from my cognitive-architecture research, Aura), **tick-frozen decay** (memory ages by interactions, not wall-clock), **decay-never-delete** (faded links can re-light), **line-level lossless provenance** (every concept points to the exact source line), and **cloud persistence** (InsForge). I also tested on LoCoMo — short conversations that fit in context — and confirmed memory systems give no edge there. Knowing where your system doesn't help is part of the engineering."

**Why this lands:** you benchmarked honestly at n=48 random, conceded the tie, and the differentiation is architectural, not a cherry-picked number. That reads as *rigor*.

---

## Live demo (2 commands)
```bash
python recall.py "melanie beach"     # concept trace, a few hundred tokens vs stuffing full history
python sync_insforge.py status       # the same memory, persisted in the cloud
```

---

## Sponsor hooks
- **InsForge ($500):** memory graph lives in InsForge Postgres, RLS-private, agent-native (`sync_insforge.py`).
- Zero-LLM write path = no API cost to *build* memory (only reading uses the model).

*Solo build, AGI Summit Hackathon 2026 — Cora Zeng.*
