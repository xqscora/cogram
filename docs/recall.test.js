"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const recall = require("./recall.js");
const data = require("./graph.json");

function run(query, graph = data, tick = graph.meta.current_tick) {
  const tokens = recall.tokenize(query);
  const seeds = recall.seedActivation(tokens, graph.nodes);
  const activation = recall.spreadActivation(seeds, recall.buildAdjacency(graph.edges), 2, tick);
  return { seeds, hits: recall.rankProvenance(graph, activation, seeds, tokens) };
}

const examples = [
  ["dacite default_factory dataclass", "konradhalas__dacite"],
  ["overriddenSymbolFrom cognitive complexity binary logical operators", "Melevir__cognitive_complexity"],
  ["electionguard words.py bad input Optional", "microsoft__electionguard-python"],
];
for (const [query, repo] of examples) {
  test(`top displayed source belongs to the queried project: ${query}`, () => {
    const { hits } = run(query);
    assert.ok(hits.length > 0);
    assert.ok(hits[0].line.file.includes(repo), hits[0].line.file);
    for (const hit of hits) {
      assert.equal(data.lines.find(l => l.idx === hit.line.idx), hit.line);
      assert.ok(data.pointers[hit.concept].includes(hit.line.idx));
      assert.ok(Number.isFinite(hit.score));
    }
  });
}

test("an exact compound identifier does not also seed its generic substring", () => {
  const { seeds } = run("dacite default_factory dataclass");
  assert.deepEqual([...seeds.keys()], ["dacite", "default_factory", "dataclass"]);
});

test("unknown and stop-word-only queries cannot return the archived example", () => {
  for (const query of ["zzzxqv987", "the and with", ""]) {
    const { seeds, hits } = run(query);
    assert.equal(seeds.size, 0);
    assert.deepEqual(hits, []);
  }
});

test("query order and case do not change the best source", () => {
  assert.equal(run("DATACLASS DACITE DEFAULT_FACTORY").hits[0].line.idx,
    run("dacite default_factory dataclass").hits[0].line.idx);
});

test("export answer labels and static example are never ranking inputs", () => {
  const modified = { ...data, answer_line_idxs: [0],
    meta: { ...data.meta, knowledge_update: { old_line_idx: 0, new_line_idx: 0 } } };
  assert.deepEqual(run(examples[0][0], modified).hits, run(examples[0][0]).hits);
});

test("rank source lines from every exact seed even if hubs dominate the top activations", () => {
  const graph = {
    meta: { n_sessions: 600, current_tick: 600 },
    nodes: [{ id: "needle", df: 1 }, ...Array.from({ length: 15 }, (_, i) => ({ id: `hub${i}`, df: 600 }))],
    lines: [{ idx: 7, file: "needle.md", line: 9, text: "needle evidence" }],
    pointers: { needle: [7] }, edges: [],
  };
  const act = new Map(graph.nodes.map(n => [n.id, n.id === "needle" ? 1 : 1000]));
  const hits = recall.rankProvenance(graph, act, new Map([["needle", 1]]), ["needle"]);
  assert.equal(hits[0].line.idx, 7);
});

test("IDF discounts ubiquitous concepts with otherwise equal evidence", () => {
  const graph = {
    meta: { n_sessions: 600 }, nodes: [{ id: "rare", df: 1 }, { id: "common", df: 600 }],
    lines: [{ idx: 0, file: "needle-a.md", text: "needle evidence", line: 1 },
      { idx: 1, file: "needle-b.md", text: "needle evidence", line: 1 }],
    pointers: { rare: [0], common: [1] },
  };
  const hits = recall.rankProvenance(graph, new Map([["rare", 1], ["common", 1]]), new Map(), ["needle"]);
  assert.equal(hits[0].line.idx, 0);
  assert.ok(hits[0].score > hits[1].score);
});

test("idle decay changes weights without changing the stored snapshot", () => {
  const snapshot = JSON.stringify(data);
  assert.ok(recall.effWeight(1, 600, 850) < recall.effWeight(1, 600, 600));
  assert.ok(recall.effWeight(1, 600, 850) >= 0.05);
  for (const [query, repo] of examples) assert.ok(run(query, data, 850).hits[0].line.file.includes(repo));
  assert.equal(JSON.stringify(data), snapshot);
});

test("payload estimate is recomputed from the actual returned full source text", () => {
  const query = examples[0][0];
  const hits = run(query).hits;
  const payload = [`Query: ${query}`, "Retrieved provenance:",
    ...hits.map(h => `  [${h.line.file}:${h.line.line}] ${h.line.text}`)].join("\n");
  assert.equal(recall.estimatePayloadTokens(query, hits), Math.floor([...payload].length / 4));
  assert.notEqual(recall.estimatePayloadTokens(query, hits), data.meta.budget_tokens);
});

test("the app loads the tested module and labels historical evidence separately", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
  assert.ok(html.indexOf('src="recall.js') < html.indexOf('src="app.js'));
  assert.match(app, /rankProvenance\(DATA, act, seeds, tokenize\(query\)\)/);
  assert.match(html, /Archived dacite example/);
  assert.doesNotMatch(html, /\$120k|same answer quality|full concept graph is loaded/);
  const report = fs.readFileSync(path.join(__dirname, "..", "benchmark_longmem_results.md"), "utf8");
  assert.match(report, /58\.3% \(28\/48\).*1,992/);
  assert.match(report, /35\.4% \(17\/48\).*89,469/);
  assert.match(app, /acc: "58\.3%", correct: "28\/48", tokens: "1,992"/);
  assert.match(app, /acc: "35\.4%", correct: "17\/48", tokens: "89,469"/);
});
