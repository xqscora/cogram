# Cogram Relay

Competition development began October 30, 2026, after CSC Winter Sparkathon opened. This is a new collaboration workflow over Cora Zeng's existing Cogram retrieval engine, not a new memory algorithm, a clinical product, or a renamed completed entry.

## User and problem

A student teammate taking over a debugging investigation needs the relevant source evidence and an explicit next step, not a whole chat history or an untraceable AI summary. Relay makes a deliberately selected evidence set portable and checkable against a shared corpus snapshot. Both teammates must have the same public snapshot in this version.

## New work

- Per-source selection from real Cogram recall results, retaining complete source text and pointers.
- Portable JSON capsule with query, scenario tick, optional next step and SHA-256 integrity value.
- Strict size/schema/version validation, exact comparison with the receiver's corpus, and rejection of unknown or altered evidence.
- Byte-budget enforcement over the actual UTF-8 file; never silently truncate quotes.
- Incoming review showing overlap, incoming-only and local-only sources; explicit adoption rather than silent replacement.
- Query edits invalidate stale evidence and exports. Files are processed locally; no account, inference request, telemetry, storage or upload endpoint is added.

## Pre-existing assets and attribution

Base: `xqscora/cogram` main `7fccc3587ca67a588fd56cf6664cbe0f548c87e3`, including `docs/recall.js`, the capped public SWE-agent trajectory graph, Cytoscape and all historical benchmarks. These predate this competition. Existing retrieval accuracy numbers are not Relay collaboration results. Graph export selection is curated, not a held-out study. Public trajectories can contain suggestions or failed investigations; they are not certified fixes.

The new work is confined to `docs/relay/`. No changes to the main Arbiter demonstration, graph inputs, Python memory core, backend or historical benchmark results are required. The repository license and upstream notices remain applicable. AI coding assistance was used for design, implementation and testing. Cora's review and ability to explain the work have not been assumed or fabricated.

## Run and test

From the repository root:

```powershell
node --test docs/recall.test.js docs/relay/capsule.test.js
python -m http.server 8796 --directory docs
```

Open `http://127.0.0.1:8796/relay/`. The three supplied query examples are real public corpus investigations, not invented evaluations. None constitutes a user study. Keep a separate evidence record of actual browser checks and results.

## Trust and privacy boundary

SHA-256 detects unexpected changes; it is not a signature and does not prove who wrote a capsule. A sender can intentionally rehash an edited note. Exact corpus comparison also catches rehashed quote edits, but cannot establish the truth of the original corpus. The receiver requires the same snapshot. No arbitrary URL is opened from an imported file and imported strings are rendered through `textContent`.

The checked-in corpus is public. A future private-data edition would need consent, access control, redaction review and key management; this prototype does not provide them. Local export is not encryption. Review any note before sharing a file. Nothing is automatically sent to a teammate.

## Required next evidence

Browser round trip, corruption rejection, stale-query invalidation, byte-budget errors and desktop/mobile layout must pass before describing the prototype as tested. No collaboration time savings, award probability or production security claim is supported by these functional checks. CSC registration, award opt-in and final submission are separate external actions; this branch alone proves none of them.
