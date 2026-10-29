# Functional verification, 2026-10-30

## Executed

- Node's test runner: 26 passing checks, combining 12 existing retrieval tests and 14 new capsule tests. Real public graph used for positive round trips; mutated copies used to test rejection, not claimed as experimental data.
- Desktop browser: real dacite retrieval, selective inclusion of two full source records, optional next step and exact 852-byte JSON preview.
- A separate receiving tab imported the file through the actual file chooser, showed 0 shared / 2 incoming / 0 local-only sources, retained its local selection until explicit adoption, then selected the same two records.
- A quote-edited file was rejected while retaining the receiver's current two-source selection.
- Query editing cleared selected records and disabled export; an unknown query returned no evidence.
- All 12 electionguard results plus a long UTF-8 note exceeded an 8 KiB budget: export disabled, no quote silently truncated.
- A 390 x 844 viewport was applied through the documented tab CDP development capability after the higher-level viewport override failed to change the actual width. Actual client width and scroll width were both 390. Incoming file review and explicit adoption also passed at this width. Temporary overrides were cleared afterward.
- Desktop graph capture: 542 x 200 pixels, 473 green-node pixels under the recorded color threshold, visibly nonblank. Source/selection changes rebuild the graph from the real corpus; this is a compact neighborhood, not the complete graph.

## Explicit gaps

- The browser download event timed out after clicking export. The preview has exact valid serialized bytes, and files with those bytes were successfully imported, but the browser's download-to-disk completion was not independently verified. The UI therefore says "Download requested", not "exported".
- The first attempt to capture a collapsed preview yielded an empty file. That file is not valid capsule evidence. The corrected `two-sources-visible.json` was captured only after expanding and reading visible JSON, and is the one used in successful imports.
- The Cua DOM proxy did not expose canvas getContext; pixel QA used the captured image instead. No hidden runtime variables were inspected.
- No real student-team usability study, collaboration timing result, new retrieval accuracy benchmark, arbitrary/private corpus support or production authentication test was performed.
- The host browser has third-party extensions. The app adds no upload or telemetry endpoint; that does not certify the privacy behavior of the browser itself.

This prototype and branch do not prove CSC registration, award opt-in or submission. Existing Arbiter submission is separate and unchanged.
