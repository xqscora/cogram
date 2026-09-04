# Architecture: Strands x Cogram

```text
Developer task
    -> Strands Agent (plan / tool call / observe / decide)
        -> cogram_recall or cogram_ingest_turn
            -> Cogram memory_api
                -> zero-LLM concept graph
                    -> bounded file:line evidence
```

The demo uses the actual public Cogram graph implementation in the parent
repository. Each run points to a disposable graph and transcript directory,
so judges can run it without touching a user's memory. `source_path` is an
explicit provenance anchor for the ingested turn; it is not a claim that the
memory layer inspected or modified the source file.

The live path gives Strands the decision authority over when to recall. The
dry-run path makes that boundary visible without pretending that a local test
has a cloud model. Neither path auto-applies patches.
