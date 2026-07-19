# Cogram vs Traditional Summary Memory — Token Benchmark

Assumptions: 10:1 summary compression ratio; summarizer reads full corpus at least once at build time (lower bound); tokenizer = tiktoken cl100k_base.

## Measured values

| Metric | Tokens |
|--------|-------:|
| Raw corpus (84 transcripts) | 4,948,425 |
| Cogram index (`concept_graph.json`) | 1,057,434 |
| Avg concept trace per query | 456 |

### Per-query trace tokens

| Query | Trace tokens |
|-------|-------------:|
| `hackathon insforge` | 464 |
| `MFA attention` | 466 |
| `college application stanford` | 447 |
| `aura neurons memory` | 454 |
| `backup 备份` | 449 |

## Architecture comparison

| Architecture | Build LLM-token cost | Per-query context cost | Information loss |
|--------------|---------------------:|-------------------------:|------------------|
| **Cogram** (concept graph) | **0** (statistics only) | **~456** | None at index tier; optional `--deep` for raw lines |
| **Per-session summaries** | ≥ 5,443,267 (4,948,425 read + 494,842 write) | ~494,842 (all summaries loaded) | Summarizer bias; detail dropped at write time |
| **Rolling compaction summary** | ≥ 5,443,267 (same initial build) | ~3,000 (fixed window) | **Lossy**: old details irreversibly gone |

## Compression vs raw corpus

| | vs raw corpus (4,948,425 tokens) |
|--|--:|
| Cogram index | 4.7× smaller |
| Cogram trace (avg) | 10,852× smaller |
| All summaries per query | 10.0× smaller |
