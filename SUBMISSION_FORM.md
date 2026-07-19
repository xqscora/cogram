# AGI Summit 2026 Hackathon — Submission Fields (copy-paste)

Check-in: Jul 18 9:00 AM – Jul 19 5:00 PM. Fields editable until deadline.

---

## 1. Project Title
```
Cogram — Procedural Memory for Coding Agents
```

## 2. Project Description
```
Coding agents (SWE-agent, OpenHands, Cursor, Claude Code) are amnesiacs: every run starts cold and re-derives fixes they already found last month. The usual patch — stuffing history into context — costs tens of thousands of tokens per turn and still degrades on long context.

Cogram is a procedural-memory substrate. It reads an agent's past work (reasoning → command → error → fix → patch) and builds a concept graph with line-level provenance — using ZERO LLM tokens (pure statistics: co-occurrence + a surprise/novelty signal). Recall costs ~200 tokens and points to the exact source line of the past fix. Memory decays by experienced interactions ("ticks"), never deletes — stale fixes fade but re-light on demand.

Target user: anyone building or running coding agents who wants cross-session learning without paying an LLM to memorize.

Validated on 600 real public SWE-agent trajectories (CC-BY 4.0): 0-token learning, 4.5× index compression, 7,000–17,000× smaller recall than re-reading history. On the standard memory benchmark (LongMemEval, ICLR 2025) it matches the best retriever at ~45× fewer tokens. Cloud persistence via InsForge.
```

## 3. GitHub Repository
```
[TODO] create a PUBLIC repo with ONLY the cogram/ code (do NOT link the personal monorepo).
```

## 4. Demo Video (< 3 min)
```
[TODO] record: problem (agents forget) → 0-token learning on SWE trajectories → new error → recall in ~200 tokens with file:line provenance → tick slider (decay-never-delete). Link here.
```

## 5. Primary Track
```
Open / AI-infrastructure (dev tools). Not healthcare or fintech — pick the general/open track.
Sponsor prize target: InsForge (agent-native BaaS, $500).
```

## 6. Sponsor Technologies Used
```
InsForge — used as the cloud-persistence backend for Cogram's concept graph
(Postgres-backed store synced via the InsForge CLI + API; AI Gateway used for benchmark LLM-as-judge).
```

## 7. Terms & Conditions
```
[check the box]
```

## 8. Live Project URL (optional)
```
[optional — web demo currently runs locally at localhost:8090; leave blank or deploy later]
```

---

## Blockers to clear before final submit
1. **Public GitHub repo** — the cogram/ folder only, scrubbed of personal paths. (Cogram code is self-contained; ~15 py files + web/ + README.)
2. **Demo video** — ≤3 min screen recording.
3. (optional) deploy web demo for a Live URL.
