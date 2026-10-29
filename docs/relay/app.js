(async function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    R = window.CogramRecall,
    C = window.CogramCapsule;
  let graph,
    snapshot,
    hits = [],
    selected = new Set(),
    currentQuery = "",
    tick;
  let outgoing = null,
    incoming = null,
    generation = 0,
    importGeneration = 0,
    cy;
  function status(message, error = false) {
    $("status").textContent = message;
    $("status").classList.toggle("error", error);
  }
  function sourceRow(line, score, selectable) {
    const detail = document.createElement("details");
    detail.className = "source";
    const summary = document.createElement("summary");
    if (selectable) {
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = selected.has(line.idx);
      check.setAttribute("aria-label", `Include source ${line.idx}`);
      check.addEventListener("click", (event) => event.stopPropagation());
      check.addEventListener("change", () => {
        if (check.checked) selected.add(line.idx);
        else selected.delete(line.idx);
        updateCapsule();
      });
      summary.append(check);
    }
    const pointer = document.createElement("span");
    pointer.className = "pointer";
    pointer.textContent = `${line.file}:${line.line}`;
    summary.append(pointer);
    if (score !== undefined) {
      const s = document.createElement("span");
      s.className = "score";
      s.textContent = score.toFixed(2);
      summary.append(s);
    }
    const text = document.createElement("pre");
    text.textContent = line.text;
    const origin = document.createElement("p");
    origin.className = "origin";
    origin.textContent = `Source ${line.idx} · research trajectory`;
    detail.append(summary, text, origin);
    return detail;
  }
  function renderResults() {
    $("results").replaceChildren(
      ...hits.map((h) => sourceRow(h.line, h.score, true)),
    );
    $("result-count").textContent = `${hits.length} sources`;
    if (!hits.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "No matching source evidence.";
      $("results").append(p);
    }
  }
  function renderGraph() {
    if (!graph || !cy) return;
    const active = hits.filter(
      (h) => !selected.size || selected.has(h.line.idx),
    );
    const concepts = new Set(
      active
        .flatMap((h) =>
          h.concept
            ? [h.concept]
            : Object.keys(graph.pointers).filter((id) =>
                graph.pointers[id].includes(h.line.idx),
              ),
        )
        .slice(0, 3),
    );
    const ids = new Set(concepts),
      related = [];
    for (const e of graph.edges
      .filter((e) => concepts.has(e.source) || concepts.has(e.target))
      .sort((a, b) => b.w_raw - a.w_raw)) {
      const extra = [e.source, e.target].filter((id) => !ids.has(id));
      if (ids.size + extra.length > 6) continue;
      extra.forEach((id) => ids.add(id));
      related.push(e);
      if (related.length === 8) break;
    }
    cy.elements().remove();
    cy.add(
      [...ids].map((id) => ({
        data: {
          id,
          label: id.length > 18 ? `${id.slice(0, 16)}…` : id,
          primary: concepts.has(id) ? 1 : 0,
        },
      })),
    );
    cy.add(
      related.map((e, i) => ({
        data: { id: `edge-${i}`, source: e.source, target: e.target },
      })),
    );
    cy.layout({ name: "circle", padding: 30, animate: false }).run();
  }
  function renderIncoming() {
    $("incoming").hidden = !incoming;
    if (!incoming) return;
    $("incoming-status").textContent =
      "Source text and pointers match the loaded snapshot.";
    $("incoming-query").textContent = incoming.query;
    $("incoming-note").textContent = incoming.note || "No next step supplied.";
    const difference = C.compare(
      [...selected],
      incoming.sources.map((s) => s.idx),
    );
    $("difference").textContent =
      `${difference.shared.length} shared · ${difference.incoming.length} incoming only · ${difference.localOnly.length} local only`;
    $("incoming-sources").replaceChildren(
      ...incoming.sources.map((s) => sourceRow(s, undefined, false)),
    );
  }
  async function updateCapsule() {
    const revision = ++generation;
    outgoing = null;
    $("export").disabled = true;
    $("selected-count").textContent = `${selected.size} selected`;
    renderGraph();
    renderIncoming();
    if (!selected.size) {
      $("preview").textContent = "No evidence selected.";
      $("byte-count").textContent = "0 bytes";
      $("integrity").textContent = "No capsule";
      return;
    }
    try {
      const result = await C.create(
        graph,
        snapshot,
        currentQuery,
        [...selected],
        $("note").value,
        tick,
        Number($("budget").value),
      );
      if (revision !== generation) return;
      outgoing = result;
      $("preview").textContent = result.text;
      $("byte-count").textContent =
        `${result.bytes.toLocaleString()} / ${Number($("budget").value).toLocaleString()} bytes`;
      $("integrity").textContent =
        `SHA-256 ${result.capsule.integrity.slice(0, 10)}`;
      $("export").disabled = false;
      status("Capsule ready for local export.");
    } catch (error) {
      if (revision !== generation) return;
      $("preview").textContent = "No exportable capsule.";
      $("byte-count").textContent = "Over budget or invalid selection";
      $("integrity").textContent = "Not exportable";
      status(error.message, true);
    }
  }
  function runQuery() {
    currentQuery = $("query").value.trim();
    tick = graph.meta.current_tick;
    const tokens = R.tokenize(currentQuery),
      seeds = R.seedActivation(tokens, graph.nodes);
    const activation = R.spreadActivation(
      seeds,
      R.buildAdjacency(graph.edges),
      2,
      tick,
    );
    hits = R.rankProvenance(graph, activation, seeds, tokens, 12);
    selected = new Set();
    renderResults();
    updateCapsule();
    status(
      hits.length
        ? "Evidence recalled. No sources selected."
        : "No matching source evidence.",
    );
  }
  $("query-form").addEventListener("submit", (event) => {
    event.preventDefault();
    runQuery();
  });
  $("query").addEventListener("input", () => {
    ++generation;
    outgoing = null;
    selected.clear();
    hits = [];
    currentQuery = "";
    $("export").disabled = true;
    $("preview").textContent =
      "Investigation changed; previous selection cleared.";
    $("selected-count").textContent = "0 selected";
    $("byte-count").textContent = "0 bytes";
    $("integrity").textContent = "No capsule";
    $("note").value = "";
    renderResults();
    renderGraph();
    renderIncoming();
    status("Investigation changed.");
  });
  $("note").addEventListener("input", updateCapsule);
  $("budget").addEventListener("change", updateCapsule);
  $("export").addEventListener("click", () => {
    if (!outgoing) return;
    const url = URL.createObjectURL(
      new Blob([outgoing.text], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `cogram-evidence-${outgoing.capsule.integrity.slice(0, 12)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status("Download requested. No upload was made.");
  });
  $("import").addEventListener("click", () => {
    $("file").value = "";
    $("file").click();
  });
  $("file").addEventListener("change", async () => {
    const file = $("file").files[0];
    if (!file) return;
    const revision = ++importGeneration;
    try {
      if (file.size > C.MAX_BYTES)
        throw new Error("Capsule exceeds the 128 KiB import limit.");
      const verified = await C.verify(await file.text(), graph, snapshot);
      if (revision !== importGeneration) return;
      incoming = verified;
      renderIncoming();
      status("Incoming capsule verified. Local selection unchanged.");
    } catch (error) {
      if (revision !== importGeneration) return;
      incoming = null;
      renderIncoming();
      status(error.message, true);
    }
  });
  $("dismiss").addEventListener("click", () => {
    ++importGeneration;
    incoming = null;
    renderIncoming();
    status("Incoming review dismissed.");
  });
  $("adopt").addEventListener("click", () => {
    if (!incoming) return;
    currentQuery = incoming.query;
    $("query").value = currentQuery;
    tick = incoming.tick;
    $("note").value = incoming.note;
    selected = new Set(incoming.sources.map((s) => s.idx));
    hits = incoming.sources.map((line) => ({ line }));
    incoming = null;
    renderResults();
    renderIncoming();
    updateCapsule();
  });
  try {
    const response = await fetch("../graph.json");
    if (!response.ok) throw new Error(`Corpus HTTP ${response.status}`);
    graph = await response.json();
    snapshot = await C.snapshotId(graph);
    tick = graph.meta.current_tick;
    $("snapshot").textContent =
      `${graph.lines.length.toLocaleString()} source lines · snapshot ${snapshot.slice(0, 12)}`;
    cy = cytoscape({
      container: $("graph"),
      elements: [],
      userZoomingEnabled: false,
      userPanningEnabled: false,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#c2cdc5",
            label: "data(label)",
            "font-size": 10,
            width: 16,
            height: 16,
            color: "#334b3e",
            "text-background-color": "#f1f5f2",
            "text-background-opacity": 0.9,
          },
        },
        {
          selector: "node[primary = 1]",
          style: { "background-color": "#176758", width: 24, height: 24 },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#c0c5bf",
            "curve-style": "bezier",
          },
        },
      ],
    });
    for (const query of graph.meta.demo_queries) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = query;
      b.addEventListener("click", () => {
        $("query").value = query;
        $("note").value = "";
        runQuery();
      });
      $("examples").append(b);
    }
    $("query").disabled = false;
    $("recall").disabled = false;
    $("import").disabled = false;
    runQuery();
  } catch (error) {
    status(`Unable to load workspace: ${error.message}`, true);
  }
})();
