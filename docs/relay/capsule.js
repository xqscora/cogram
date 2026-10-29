/* Portable, bounded evidence selections over the existing Cogram snapshot. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CogramCapsule = api;
})(typeof window === "undefined" ? this : window, function () {
  "use strict";
  const FORMAT = "cogram-evidence/1";
  const MAX_BYTES = 128 * 1024;
  const MAX_SOURCES = 16;
  function canonical(value) {
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    if (value && typeof value === "object")
      return `{${Object.keys(value)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
        .join(",")}}`;
    return JSON.stringify(value);
  }
  function bytes(text) {
    return new TextEncoder().encode(text).length;
  }
  async function digest(value) {
    const hash = await globalThis.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(canonical(value)),
    );
    return Array.from(new Uint8Array(hash), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
  }
  function source(line) {
    return { idx: line.idx, file: line.file, line: line.line, text: line.text };
  }
  function exactKeys(value, keys, label) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.keys(value).sort().join("|") !== [...keys].sort().join("|")
    ) {
      throw new Error(`Invalid ${label} fields.`);
    }
  }
  function boundedText(text, max, label) {
    if (typeof text !== "string" || text.length > max)
      throw new Error(`Invalid ${label}.`);
  }
  async function snapshotId(graph) {
    // Hash only retrieval inputs, not answer labels or archived demonstration metadata.
    return digest({
      nodes: graph.nodes,
      edges: graph.edges,
      lines: graph.lines,
      pointers: graph.pointers,
      tick: graph.meta.current_tick,
      sessions: graph.meta.n_sessions,
    });
  }
  function bodyFor(graph, snapshot, query, indices, note, tick) {
    boundedText(query, 500, "query");
    boundedText(note, 1500, "next step");
    if (!query.trim()) throw new Error("A query is required.");
    if (
      !Number.isSafeInteger(tick) ||
      tick < graph.meta.current_tick ||
      tick > graph.meta.current_tick + 10000
    ) {
      throw new Error("Invalid scenario tick.");
    }
    if (
      !Array.isArray(indices) ||
      !indices.length ||
      indices.length > MAX_SOURCES ||
      new Set(indices).size !== indices.length
    )
      throw new Error("Select 1 to 16 distinct sources.");
    const lines = new Map(graph.lines.map((line) => [line.idx, line]));
    const sources = indices.map((idx) => {
      if (!Number.isSafeInteger(idx) || !lines.has(idx))
        throw new Error("Unknown source.");
      return source(lines.get(idx));
    });
    return { format: FORMAT, snapshot, query, tick, note, sources };
  }
  async function create(
    graph,
    snapshot,
    query,
    indices,
    note = "",
    tick = graph.meta.current_tick,
    budget = 32768,
  ) {
    if (!Number.isSafeInteger(budget) || budget < 1024 || budget > MAX_BYTES)
      throw new Error("Invalid byte budget.");
    const body = bodyFor(graph, snapshot, query, indices, note, tick);
    const capsule = { ...body, integrity: await digest(body) };
    const text = JSON.stringify(capsule, null, 2);
    if (bytes(text) > budget)
      throw new Error(
        `Selection exceeds the ${budget.toLocaleString()} byte budget. No source was truncated.`,
      );
    return { capsule, text, bytes: bytes(text) };
  }
  async function verify(text, graph, snapshot) {
    if (typeof text !== "string" || bytes(text) > MAX_BYTES)
      throw new Error("Capsule exceeds the 128 KiB import limit.");
    let capsule;
    try {
      capsule = JSON.parse(text);
    } catch {
      throw new Error("This file is not valid JSON.");
    }
    exactKeys(
      capsule,
      ["format", "snapshot", "query", "tick", "note", "sources", "integrity"],
      "capsule",
    );
    if (capsule.format !== FORMAT)
      throw new Error("Unsupported capsule version.");
    if (capsule.snapshot !== snapshot)
      throw new Error(
        "Snapshot mismatch. This capsule cannot be checked against the loaded corpus.",
      );
    if (!Array.isArray(capsule.sources)) throw new Error("Invalid sources.");
    for (const item of capsule.sources)
      exactKeys(item, ["idx", "file", "line", "text"], "source");
    const rebuilt = bodyFor(
      graph,
      snapshot,
      capsule.query,
      capsule.sources.map((s) => s.idx),
      capsule.note,
      capsule.tick,
    );
    if (canonical(capsule.sources) !== canonical(rebuilt.sources)) {
      throw new Error(
        "Source mismatch. At least one quote or source pointer was changed.",
      );
    }
    if (
      typeof capsule.integrity !== "string" ||
      capsule.integrity !== (await digest(rebuilt))
    ) {
      throw new Error(
        "Integrity mismatch. The capsule was modified or is incomplete.",
      );
    }
    return capsule;
  }
  function compare(left, right) {
    const a = new Set(left),
      b = new Set(right);
    return {
      shared: [...a].filter((id) => b.has(id)),
      incoming: [...b].filter((id) => !a.has(id)),
      localOnly: [...a].filter((id) => !b.has(id)),
    };
  }
  return {
    FORMAT,
    MAX_BYTES,
    canonical,
    bytes,
    digest,
    snapshotId,
    create,
    verify,
    compare,
  };
});
