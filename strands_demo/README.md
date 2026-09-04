# Strands x Cogram: Evidence-First Coding Agent

This is the Agents for Humans integration for Cogram. It is deliberately a
small but real product surface: Strands supplies the agent loop, while the
existing Cogram engine supplies zero-LLM procedural memory with provenance.

## Run from the repository root

```powershell
python -m pip install -r strands_demo/requirements-strands.txt
python strands_demo/run_demo.py
```

The acceptance path is offline-safe. It creates a disposable graph, ingests a
completed fix at `src/user.py`, recalls a related task, and prints a citation.
The deterministic trace shows the same boundary that a live Strands model
uses: recall evidence, decide whether it is sufficient, and never apply a
patch automatically.

For a live local model, install Ollama and set:

```powershell
$env:STRANDS_USE_OLLAMA = "1"
$env:STRANDS_OLLAMA_MODEL = "qwen2.5:1.5b"
python strands_demo/run_demo.py
```

Cloud model credentials are optional. The Cogram engine itself remains local;
the demo does not upload transcripts or call a hosted memory service.

## Verify

```powershell
python -m pytest strands_demo/test_smoke.py -q
```

The repository's original Cogram tests remain the broader regression suite.
