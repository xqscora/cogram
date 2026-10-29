"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path");
const C = require("./capsule.js"),
  R = require("../recall.js"),
  graph = require("../graph.json");
const queries = graph.meta.demo_queries;
const snapshotPromise = C.snapshotId(graph);
function sources(query) {
  const tokens = R.tokenize(query),
    seeds = R.seedActivation(tokens, graph.nodes);
  const activation = R.spreadActivation(
    seeds,
    R.buildAdjacency(graph.edges),
    2,
    graph.meta.current_tick,
  );
  return R.rankProvenance(graph, activation, seeds, tokens, 12).map(
    (h) => h.line.idx,
  );
}
async function make(
  query = queries[0],
  indices = sources(query).slice(0, 3),
  note = "Compare this evidence with the current source before changing code.",
) {
  return C.create(graph, await snapshotPromise, query, indices, note);
}
for (const query of queries)
  test(`real corpus capsule round trip: ${query}`, async () => {
    const result = await make(query),
      verified = await C.verify(result.text, graph, await snapshotPromise);
    assert.deepEqual(verified, result.capsule);
    for (const source of verified.sources) {
      const original = graph.lines.find((l) => l.idx === source.idx);
      assert.equal(source.file, original.file);
      assert.equal(source.text, original.text);
      assert.equal(source.line, original.line);
    }
    assert.equal(result.bytes, Buffer.byteLength(result.text, "utf8"));
  });
test("a source tampered with and rehashed still fails corpus validation", async () => {
  const { capsule } = await make();
  capsule.sources[0].text += " fabricated fix";
  const { integrity, ...body } = capsule;
  body.sources = capsule.sources;
  capsule.integrity = await C.digest(body);
  await assert.rejects(
    C.verify(JSON.stringify(capsule), graph, await snapshotPromise),
    /Source mismatch/,
  );
});
test("a changed source pointer fails validation", async () => {
  const { capsule } = await make();
  capsule.sources[0].line += 1;
  await assert.rejects(
    C.verify(JSON.stringify(capsule), graph, await snapshotPromise),
    /Source mismatch/,
  );
});
test("query and next-step edits require a new integrity hash", async () => {
  for (const key of ["query", "note"]) {
    const { capsule } = await make();
    capsule[key] += " changed";
    await assert.rejects(
      C.verify(JSON.stringify(capsule), graph, await snapshotPromise),
      /Integrity mismatch/,
    );
  }
});
test("all retrieval inputs contribute to snapshot identity, answer labels do not", async () => {
  const before = JSON.stringify(graph),
    changed = structuredClone(graph);
  changed.lines[0].text += " changed";
  assert.notEqual(await C.snapshotId(changed), await snapshotPromise);
  assert.equal(
    await C.snapshotId({
      ...graph,
      answer_line_idxs: [99999],
      demo_query: "irrelevant",
    }),
    await snapshotPromise,
  );
  assert.equal(JSON.stringify(graph), before);
});
test("unknown snapshots and schema versions are rejected", async () => {
  const result = await make();
  await assert.rejects(
    C.verify(result.text, graph, "0".repeat(64)),
    /Snapshot mismatch/,
  );
  result.capsule.format = "cogram-evidence/999";
  await assert.rejects(
    C.verify(JSON.stringify(result.capsule), graph, await snapshotPromise),
    /Unsupported/,
  );
});
test("unknown fields, null objects, bad JSON and oversized files are rejected", async () => {
  const result = await make();
  result.capsule.script = "alert(1)";
  for (const text of [
    "null",
    "[]",
    "{",
    JSON.stringify(result.capsule),
    " ".repeat(C.MAX_BYTES + 1),
  ]) {
    await assert.rejects(C.verify(text, graph, await snapshotPromise));
  }
});
test("budgeting uses serialized UTF-8 bytes and never silently truncates evidence", async () => {
  const snapshot = await snapshotPromise,
    ids = sources(queries[0]).slice(0, 3);
  const note = "核对证据与当前代码。".repeat(20);
  const full = await C.create(graph, snapshot, queries[0], ids, note);
  assert.ok(full.bytes > full.text.length);
  const exact = await C.create(
    graph,
    snapshot,
    queries[0],
    ids,
    note,
    graph.meta.current_tick,
    full.bytes,
  );
  assert.equal(exact.text, full.text);
  await assert.rejects(
    C.create(
      graph,
      snapshot,
      queries[0],
      ids,
      note,
      graph.meta.current_tick,
      full.bytes - 1,
    ),
    /No source was truncated/,
  );
});
test("empty, duplicate and out-of-corpus source selections cannot be exported", async () => {
  const ids = sources(queries[0]);
  for (const selection of [
    [],
    [ids[0], ids[0]],
    [-1],
    Array.from({ length: 17 }, (_, i) => graph.lines[i].idx),
  ]) {
    await assert.rejects(make(queries[0], selection));
  }
});
test("source-set comparison keeps local and incoming work distinct", async () => {
  const a = sources(queries[0]).slice(0, 3),
    b = sources(queries[1]).slice(0, 2);
  assert.equal(C.compare(a, b).shared.length, 0);
  const comparison = C.compare(a, [a[1], b[0]]);
  assert.deepEqual(comparison.shared, [a[1]]);
  assert.deepEqual(comparison.incoming, [b[0]]);
  assert.deepEqual(comparison.localOnly, [a[0], a[2]]);
});
test("unsupported tick and oversized query/note are rejected", async () => {
  const snapshot = await snapshotPromise,
    ids = sources(queries[0]).slice(0, 1);
  for (const tick of [NaN, 0, graph.meta.current_tick + 10001, 600.5]) {
    await assert.rejects(
      C.create(graph, snapshot, queries[0], ids, "", tick),
      /tick/,
    );
  }
  await assert.rejects(C.create(graph, snapshot, "a".repeat(501), ids));
  await assert.rejects(
    C.create(graph, snapshot, queries[0], ids, "a".repeat(1501)),
  );
});
test("HTML uses the tested module and the UI renders capsule data as text", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const js = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
  assert.ok(html.includes('src="capsule.js"'));
  assert.ok(js.includes("C.verify("));
  assert.ok(js.includes("C.create("));
  assert.ok(!js.includes("innerHTML"));
  assert.ok(!js.includes("localStorage"));
  assert.ok(!js.includes("XMLHttpRequest"));
  assert.equal((js.match(/fetch\(/g) || []).length, 1);
});
