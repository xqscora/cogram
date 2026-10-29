/* Shared by the static demo and its Node regression tests. No network or LLM. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CogramRecall = api;
})(typeof window === "undefined" ? this : window, function () {
  "use strict";

  const EPS = 0.05;
  const TAU_TICKS = 50;
  const EN_STOP = new Set(
    `a about above after again against all am an and any are as at be because been
    before being below between both but by can could did do does doing don down during
    each few for from further had has have having he her here hers herself him himself
    his how i if in into is it its itself just ll me more most my myself no nor not
    now of off on once only or other our ours ourselves out over own re s same she
    should so some such t than that the their theirs them themselves then there these
    they this those through to too under until up ve very was we were what when where
    which while who whom why will with would you your yours yourself yourselves
    also get got like make made use used using one two three new way may well much
    many still even back go going come came take took see saw say said says tell
    told think thought know knew want need let put find give given keep look looking
    something anything everything nothing someone anyone everyone into onto upon`.split(/\s+/)
  );

  function tokenize(text) {
    return (text.toLowerCase().match(/[a-z][a-z0-9_-]{2,}/g) || [])
      .filter(t => !EN_STOP.has(t));
  }

  function tokenVariants(tok) {
    const variants = new Set([tok]);
    if (tok.endsWith("s") && tok.length > 4) variants.add(tok.slice(0, -1));
    if (!tok.endsWith("s")) variants.add(`${tok}s`);
    return [...variants];
  }

  function seedActivation(queryTokens, nodes) {
    const act = new Map();
    for (const qt of queryTokens) {
      const variants = tokenVariants(qt);
      const exact = nodes.filter(n => variants.includes(n.id.toLowerCase()) ||
        variants.includes((n.label || n.id).toLowerCase()));
      // An exact identifier must not also seed generic substrings (default_factory -> default).
      if (exact.length) {
        for (const n of exact) act.set(n.id, 1);
        continue;
      }
      for (const n of nodes) {
        const labels = [n.id.toLowerCase(), (n.label || n.id).toLowerCase()];
        if (variants.some(v => labels.some(label => label.startsWith(v) || v.startsWith(label)))) {
          act.set(n.id, Math.max(act.get(n.id) || 0, 0.75));
        }
      }
    }
    return act;
  }

  function effWeight(wRaw, lastTick, curTick) {
    return EPS + (wRaw - EPS) * Math.exp(-Math.max(0, curTick - lastTick) / TAU_TICKS);
  }

  function buildAdjacency(edges) {
    const adj = new Map();
    for (const e of edges) {
      for (const [a, b] of [[e.source, e.target], [e.target, e.source]]) {
        if (!adj.has(a)) adj.set(a, []);
        adj.get(a).push({ nb: b, wRaw: e.w_raw, lastTick: e.last_tick });
      }
    }
    return adj;
  }

  function spreadActivation(act, adj, maxHops, tick) {
    let current = new Map(act);
    for (let hop = 0; hop < maxHops; hop++) {
      const next = new Map(current);
      for (const [src, score] of current) {
        if (score < 0.01) continue;
        for (const edge of adj.get(src) || []) {
          next.set(edge.nb, (next.get(edge.nb) || 0) +
            score * effWeight(edge.wRaw, edge.lastTick, tick) * 0.5);
        }
      }
      current = next;
    }
    return current;
  }

  function rankProvenance(data, activation, seeds, queryTokens, limit = 8) {
    const exactSeeds = new Set([...seeds].filter(([, s]) => s === 1).map(([id]) => id));
    const ranked = [...activation].sort((a, b) =>
      Number(exactSeeds.has(b[0])) - Number(exactSeeds.has(a[0])) || b[1] - a[1]);
    const concepts = new Set([...seeds.keys(), ...ranked.slice(0, 12).map(([id]) => id)]);
    const nodes = new Map(data.nodes.map(n => [n.id, n]));
    const lines = new Map(data.lines.map(line => [line.idx, line]));
    const hits = new Map();
    const nDocs = Math.max(data.meta.n_sessions || 1, 1);
    const tokens = [...new Set(queryTokens)];

    // Same IDF/relevance factors as swe_recall_demo.py; rank only exported pointers.
    // Unlike the legacy first-pointer-wins loop, retain the strongest support per line.
    for (const concept of concepts) {
      const df = Math.min(Math.max(nodes.get(concept)?.df || 1, 1), nDocs);
      const idf = nDocs > 1 ? Math.log((nDocs + 1) / df) / Math.log(nDocs + 1) : 1;
      for (const idx of data.pointers[concept] || []) {
        const line = lines.get(idx);
        if (!line) continue;
        const text = line.text.toLowerCase();
        const file = (line.file || "").toLowerCase();
        const textHits = tokens.filter(t => text.includes(t));
        const fileHits = tokens.filter(t => file.includes(t)).length;
        const relevance = textHits.length * (textHits.length >= 2 ? 2 : 1);
        if (!fileHits && relevance < 2) continue;
        const score = (activation.get(concept) || seeds.get(concept) || 0) * idf *
          (1 + (exactSeeds.has(concept) ? 2 : 0) + relevance + fileHits * 2);
        if (score > (hits.get(idx)?.score || 0)) {
          hits.set(idx, { line, score, concept, textHits, fileHits });
        }
      }
    }
    return [...hits.values()].sort((a, b) => b.score - a.score || a.line.idx - b.line.idx)
      .slice(0, limit);
  }

  function estimatePayloadTokens(query, hits) {
    const payload = [`Query: ${query}`, "Retrieved provenance:",
      ...hits.map(h => `  [${h.line.file}:${h.line.line}] ${h.line.text}`)].join("\n");
    return Math.floor([...payload].length / 4);
  }

  return { tokenize, seedActivation, effWeight, buildAdjacency, spreadActivation,
    rankProvenance, estimatePayloadTokens };
});
