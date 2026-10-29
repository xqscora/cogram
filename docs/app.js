/**
 * Cogram interactive demo — zero-LLM procedural-memory concept graph.
 * Fully static; loads graph.json built by build_web_graph_swe.py.
 * Retrieval operates on an exported subset, not the full Python graph.
 */
(function () {
  "use strict";

  const GRAPH_VERSION = "5";
  const { tokenize, seedActivation, effWeight, buildAdjacency, spreadActivation,
    rankProvenance, estimatePayloadTokens } = window.CogramRecall;

  function setStatus(msg, isError) {
    const el = document.getElementById("status-line");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("error", Boolean(isError));
  }

  window.addEventListener("error", (evt) => {
    setStatus(`JS error: ${evt.message} (${evt.filename ? evt.filename.split("/").pop() : "?"}:${evt.lineno})`, true);
  });
  window.addEventListener("unhandledrejection", (evt) => {
    setStatus(`Unhandled: ${evt.reason && evt.reason.message ? evt.reason.message : evt.reason}`, true);
  });

  /** @type {object|null} */
  let DATA = null;
  /** @type {import('cytoscape').Core|null} */
  let cy = null;
  /** @type {object[]} */
  let lines = [];
  let currentTick = 53;
  let spreadTimer = 0;

  const BENCHMARK = {
    n: 48,
    round: 3,
    rows: [
      { name: "bm25", acc: "58.3%", correct: "28/48", tokens: "1,993" },
      { name: "cogram_bm25", acc: "58.3%", correct: "28/48", tokens: "1,992" },
      { name: "full_context", acc: "35.4%", correct: "17/48", tokens: "89,469" },
    ],
    tokenRatio: 44.9,
    source: "benchmark_longmem_results.md (Round 3, n=48 stratified, seed=42)",
  };

  const ACCENT = "#5b84a8";
  const ACCENT_DARK = "#4a6b8a";
  const LABEL_TOP_N = 10;
  const NODE_REST_FILL = "#b9c2c9";
  const NODE_REST_STROKE = "#9aa5ad";
  const EDGE_REST = "#8d99a3";

  function animateCount(el, target, duration) {
    const start = performance.now();
    const from = 0;
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(from + (target - from) * eased);
      el.textContent = val.toLocaleString();
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function renderBenchmarkFooter() {
    const tbody = document.querySelector("#results-table tbody");
    tbody.innerHTML = "";
    for (const row of BENCHMARK.rows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.name}</td>
        <td class="num">${row.acc} (${row.correct})</td>
        <td class="num">${row.tokens}</td>`;
      tbody.appendChild(tr);
    }
    document.getElementById("positioning-caption").innerHTML = `
      Historical Python benchmark: Cogram+BM25 ties BM25 at 28/48, with essentially the same context size.
      Context is ${BENCHMARK.tokenRatio}x smaller than the full-context arm, which used mixed truncation caps.
      These are not scores for this browser subset or a fresh benchmark of this revision.
      <cite>${BENCHMARK.source}</cite>`;
  }

  function renderQueryChips(queries) {
    const el = document.getElementById("query-chips");
    if (!el || !queries || !queries.length) return;
    el.innerHTML = queries
      .map((q) => `<button type="button" class="chip" data-q="${escapeHtml(q)}">${escapeHtml(q)}</button>`)
      .join("");
    el.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById("query-input").value = btn.dataset.q;
        runQuery();
      });
    });
  }

  function renderKnowledgeUpdate() {
    const ku = DATA.meta.knowledge_update || {};
    const el = document.getElementById("ku-callout");
    const oldIdx = ku.old_line_idx;
    const newIdx = ku.new_line_idx;
    const lineByIdx = new Map(lines.map((l) => [l.idx, l]));

    let html = "";
    if (oldIdx != null && lineByIdx.has(oldIdx)) {
      const ln = lineByIdx.get(oldIdx);
      html += `<div class="ku-block stale">
        <div class="ku-tag">Archived issue excerpt · trajectory tick ${ln.tick}</div>
        <div>${escapeHtml(ln.text.slice(0, 220))}${ln.text.length > 220 ? "…" : ""}</div>
        <div class="prov-meta">${escapeHtml(ln.date)} · ${escapeHtml(ln.file)}:${ln.line}</div>
      </div>`;
    }
    if (newIdx != null && lineByIdx.has(newIdx)) {
      const ln = lineByIdx.get(newIdx);
      html += `<div class="ku-block fresh">
        <div class="ku-tag">Archived investigation excerpt · tick ${ln.tick}</div>
        <div>${escapeHtml(ln.text.slice(0, 220))}${ln.text.length > 220 ? "…" : ""}</div>
        <div class="prov-meta">${escapeHtml(ln.date)} · ${escapeHtml(ln.file)}:${ln.line}</div>
      </div>`;
    }
    if (!html) {
      html = `<p class="prov-empty">No archived example in this export.</p>`;
    }
    el.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initCytoscape() {
    const maxDf = Math.max(...DATA.nodes.map((n) => n.df), 1);
    const labelIds = new Set(
      [...DATA.nodes]
        .sort((a, b) => b.df - a.df || a.id.localeCompare(b.id))
        .slice(0, LABEL_TOP_N)
        .map((n) => n.id)
    );
    const elements = [];

    // Degree-scaled tiny dots (Obsidian-style constellation)
    const degree = new Map();
    for (const e of DATA.edges) {
      degree.set(e.source, (degree.get(e.source) || 0) + 1);
      degree.set(e.target, (degree.get(e.target) || 0) + 1);
    }
    const maxDeg = Math.max(1, ...degree.values());

    for (const n of DATA.nodes) {
      const deg = degree.get(n.id) || 0;
      elements.push({
        data: {
          id: n.id,
          label: n.label,
          df: n.df,
          size: 4 + (deg / maxDeg) * 3,
        },
      });
    }

    for (const e of DATA.edges) {
      elements.push({
        data: {
          id: `${e.source}__${e.target}`,
          source: e.source,
          target: e.target,
          wRaw: e.w_raw,
          lastTick: e.last_tick,
          eff: e.eff,
        },
      });
    }

    cy = cytoscape({
      container: document.getElementById("cy"),
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "font-size": 10,
            "font-family": "Segoe UI, system-ui, sans-serif",
            color: "#7d8790",
            "text-opacity": 0,
            "text-valign": "bottom",
            "text-margin-y": 3,
            "background-color": NODE_REST_FILL,
            "border-color": NODE_REST_STROKE,
            "border-width": 0.5,
            width: "data(size)",
            height: "data(size)",
            "overlay-opacity": 0,
            "transition-property": "background-color, opacity, width, height",
            "transition-duration": "0.25s",
          },
        },
        {
          selector: "node.labeled",
          style: {
            "text-opacity": 0.8,
          },
        },
        {
          selector: "node.show-label, node.seed, node.activated, node.hover-nb",
          style: {
            "text-opacity": 1,
            color: "#1a1d20",
          },
        },
        {
          selector: "node.hover-nb",
          style: {
            "background-color": ACCENT,
            "border-color": ACCENT_DARK,
          },
        },
        {
          selector: "node.dimmed",
          style: {
            opacity: 0.08,
            "text-opacity": 0,
          },
        },
        {
          selector: "node.activated",
          style: {
            "background-color": ACCENT,
            "border-color": ACCENT_DARK,
            "border-width": 1,
            width: 9,
            height: 9,
            opacity: 1,
            "z-index": 10,
          },
        },
        {
          selector: "node.seed",
          style: {
            "background-color": ACCENT,
            "border-color": "#1a1d20",
            "border-width": 1.5,
            width: 13,
            height: 13,
            opacity: 1,
            "z-index": 20,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": EDGE_REST,
            opacity: "mapData(eff, 0.05, 1, 0.12, 0.18)",
            "curve-style": "haystack",
            "transition-property": "opacity, line-color",
            "transition-duration": "0.25s",
          },
        },
        {
          selector: "edge.route",
          style: {
            "line-color": ACCENT,
            opacity: 0.75,
            width: 1.8,
            "z-index": 15,
          },
        },
        {
          selector: "edge.hover-nb",
          style: {
            "line-color": ACCENT,
            opacity: 0.7,
            width: 1.5,
          },
        },
        {
          selector: "edge.dimmed",
          style: {
            opacity: 0.04,
          },
        },
        {
          selector: "edge.pulse",
          style: {
            "line-color": ACCENT,
            opacity: 0.9,
            width: 2,
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        nodeRepulsion: 40000,
        idealEdgeLength: 130,
        edgeElasticity: 60,
        gravity: 0.12,
        numIter: 2000,
        padding: 50,
        componentSpacing: 120,
      },
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.25,
    });

    updateEdgeDecay(currentTick);

    cy.batch(() => {
      for (const id of labelIds) {
        cy.getElementById(id).addClass("labeled");
      }
    });

    // Hover: highlight node + edges + neighbors (Obsidian-style)
    cy.on("mouseover", "node", (evt) => {
      const n = evt.target;
      n.addClass("show-label");
      n.connectedEdges().addClass("hover-nb");
      n.neighborhood("node").addClass("hover-nb");
    });
    cy.on("mouseout", "node", (evt) => {
      const n = evt.target;
      n.removeClass("show-label");
      n.connectedEdges().removeClass("hover-nb");
      n.neighborhood("node").removeClass("hover-nb");
    });
  }

  function updateEdgeDecay(tick) {
    if (!cy) return;
    cy.batch(() => {
      cy.edges().forEach((edge) => {
        const wRaw = edge.data("wRaw");
        const lastTick = edge.data("lastTick");
        const eff = effWeight(wRaw, lastTick, tick);
        edge.data("eff", eff);
      });
    });
  }

  function clearActivationVisuals() {
    if (!cy) return;
    cy.nodes().removeClass("activated seed dimmed");
    cy.edges().removeClass("pulse dimmed route");
  }

  function renderProvenance(act, seeds, query) {
    const list = document.getElementById("provenance-list");
    const ranked = [...act.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    const hits = rankProvenance(DATA, act, seeds, tokenize(query));
    document.getElementById("budget-count").textContent = hits.length
      ? estimatePayloadTokens(query, hits).toLocaleString() : "0";
    document.getElementById("ratio-pill").textContent = "estimate: characters / 4";

    if (!ranked.length) {
      list.innerHTML = `<p class="prov-empty">No concepts matched this query.</p>`;
      return;
    }

    let html = `<p class="prov-score">Concept activation: ${ranked.slice(0, 6)
      .map(([concept, score]) => `${escapeHtml(concept)} ${score.toFixed(2)}`).join(" · ")}</p>`;

    for (const { line: ln, score, concept } of hits) {
      const loc = ln.file ? `${ln.file}:${ln.line}` : `session ${ln.session}`;
      html += `<div class="prov-item source-hit">
        <div class="prov-meta">${escapeHtml(ln.date)} · ${escapeHtml(loc)}</div>
        <div>${escapeHtml(ln.text.slice(0, 280))}${ln.text.length > 280 ? "…" : ""}</div>
        <div class="prov-score">relevance ${score.toFixed(2)} · via ${escapeHtml(concept)}</div>
      </div>`;
    }
    if (!hits.length) html += `<p class="prov-empty">Matched concepts, but no sufficiently related source lines in this export.</p>`;

    list.innerHTML = html || `<p class="prov-empty">No provenance pointers for activated concepts.</p>`;
  }

  function runQuery() {
    try {
      if (!cy || !DATA) {
        setStatus("Graph not loaded yet — wait a moment and retry.", true);
        return;
      }
      const q = document.getElementById("query-input").value.trim();
      if (!q) return;

      if (spreadTimer) {
        clearTimeout(spreadTimer);
        spreadTimer = 0;
      }

      clearActivationVisuals();
      setStatus("Recalling…");
      document.getElementById("provenance-list").innerHTML =
        `<p class="prov-empty">Recalling…</p>`;

      const qtoks = tokenize(q);
      const adj = buildAdjacency(DATA.edges);
      const seeds = seedActivation(qtoks, DATA.nodes);

      if (!seeds.size) {
        setStatus("No concepts matched this query.", true);
        renderProvenance(new Map(), seeds, q);
        return;
      }

      // Wave 0: dim everything, seeds glow blue and enlarge
      cy.batch(() => {
        cy.nodes().addClass("dimmed");
        cy.edges().addClass("dimmed");
        for (const id of seeds.keys()) {
          cy.getElementById(id).removeClass("dimmed").addClass("seed");
        }
      });
      setStatus(`${seeds.size} seed concept(s) matched — spreading…`);

      // Wave 1: 1-hop at t+450ms
      spreadTimer = window.setTimeout(() => {
        const hop1 = spreadActivation(seeds, adj, 1, currentTick);
        cy.batch(() => {
          for (const [id, val] of hop1) {
            if (val > 0.05 && !seeds.has(id)) {
              cy.getElementById(id).removeClass("dimmed").addClass("activated");
            }
          }
          pulseEdgesFrom([...seeds.keys()]);
        });
        renderProvenance(hop1, seeds, q);

        // Wave 2: 2-hop at t+450+500ms
        spreadTimer = window.setTimeout(() => {
          const hop2 = spreadActivation(seeds, adj, 2, currentTick);
          let activated = 0;
          cy.batch(() => {
            for (const [id, val] of hop2) {
              if (val > 0.05) {
                const el = cy.getElementById(id);
                el.removeClass("dimmed");
                if (!el.hasClass("seed")) el.addClass("activated");
                activated++;
              }
            }
            pulseEdgesFrom([...hop2.keys()].filter((k) => hop2.get(k) > 0.15));
          });
          renderProvenance(hop2, seeds, q);
          setStatus(`Activated ${activated} concept(s) from ${seeds.size} seed(s).`);
        }, 500);
      }, 450);
    } catch (err) {
      setStatus(`Query failed: ${err.message}`, true);
      console.error(err);
    }
  }

  function pulseEdgesFrom(nodeIds) {
    // Route edges stay highlighted until the query is edited or cleared —
    // but only edges whose BOTH endpoints are lit (seed/activated), so every
    // highlighted line visibly connects two active concepts.
    const active = new Set(nodeIds);
    cy.nodes(".seed, .activated").forEach((n) => active.add(n.id()));
    cy.edges(".route").removeClass("route");
    cy.edges().forEach((e) => {
      if (active.has(e.source().id()) && active.has(e.target().id())) {
        e.removeClass("dimmed").addClass("pulse route");
      }
    });
    window.setTimeout(() => {
      cy.edges(".pulse").removeClass("pulse");
    }, 700);
  }

  function bindControls() {
    const slider = document.getElementById("tick-slider");
    const tickOut = document.getElementById("tick-value");

    slider.addEventListener("input", () => {
      currentTick = Number(slider.value);
      tickOut.textContent = String(currentTick);
      updateEdgeDecay(currentTick);
      runQuery();
    });

    document.getElementById("query-btn").addEventListener("click", runQuery);
    document.getElementById("query-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") runQuery();
    });
    // Route highlight persists until the query text is edited or cleared.
    document.getElementById("query-input").addEventListener("input", (e) => {
      if (spreadTimer) {
        clearTimeout(spreadTimer);
        spreadTimer = 0;
      }
      clearActivationVisuals();
      setStatus("");
      document.getElementById("budget-count").textContent = "0";
      document.getElementById("provenance-list").innerHTML =
        `<p class="prov-empty">${e.target.value.trim() ? "Query changed. Results cleared." : "No query."}</p>`;
    });
  }

  function initMeta() {
    const meta = DATA.meta;
    currentTick = meta.current_tick;
    document.getElementById("tick-slider").min = String(meta.current_tick);
    document.getElementById("tick-slider").max = String(meta.current_tick + 250);
    document.getElementById("tick-slider").value = String(meta.current_tick);
    document.getElementById("tick-value").textContent = String(meta.current_tick);

    const rawEl = document.getElementById("raw-count");
    animateCount(rawEl, meta.raw_corpus_tokens, 1200);

    document.getElementById("ratio-pill").textContent = "estimate: characters / 4";
    document.getElementById("budget-count").textContent = "0";
    document.getElementById("query-input").value = DATA.demo_query || meta.question;
    renderQueryChips(meta.demo_queries);
  }

  async function loadGraph() {
    if (typeof cytoscape === "undefined") {
      throw new Error("cytoscape library failed to load (vendor/cytoscape.min.js)");
    }

    // Bind controls FIRST so the button works even if graph init fails
    bindControls();
    setStatus("Loading graph…");

    const resp = await fetch(`graph.json?v=${GRAPH_VERSION}`, { cache: "no-cache" });
    if (!resp.ok) throw new Error(`Failed to load graph.json (${resp.status})`);
    DATA = await resp.json();

    lines = DATA.lines || [];

    initMeta();
    renderKnowledgeUpdate();
    renderBenchmarkFooter();
    initCytoscape();
    setStatus(`Graph loaded: ${DATA.nodes.length} concepts, ${DATA.edges.length} edges.`);

    // Auto-run demo query on load
    window.setTimeout(runQuery, 700);
  }

  function boot() {
    loadGraph().catch((err) => {
      setStatus(`Init error: ${err.message}`, true);
      const list = document.getElementById("provenance-list");
      if (list) {
        list.innerHTML =
          `<p class="prov-empty">Error: ${escapeHtml(err.message)}. Run <code>python build_web_graph.py</code> first.</p>`;
      }
      console.error(err);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
