"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function workspace() {
  const nodes = new Map();
  function element(id) {
    if (!nodes.has(id)) {
      const listeners = {};
      nodes.set(id, {
        value: id === "query" ? "initial" : id === "budget" ? "32768" : "",
        textContent: "", disabled: false, hidden: false, files: [],
        classList: { toggle() {} },
        addEventListener(name, callback) { listeners[name] = callback; },
        dispatch(name) { return listeners[name]({ preventDefault() {}, stopPropagation() {} }); },
        replaceChildren() {}, append() {}, setAttribute() {}, click() {},
      });
    }
    return nodes.get(id);
  }
  const pending = new Map();
  const capsule = {
    MAX_BYTES: 131072,
    async snapshotId() { return "snapshot"; },
    verify(text) { return pending.get(text).promise; },
    compare() { return { shared: [], incoming: [], localOnly: [] }; },
  };
  const recall = {
    tokenize() { return []; }, seedActivation() { return {}; },
    buildAdjacency() { return {}; }, spreadActivation() { return {}; },
    rankProvenance() { return []; },
  };
  const context = {
    window: { CogramRecall: recall, CogramCapsule: capsule },
    document: { getElementById: element, createElement() { return element(Symbol()); } },
    fetch: async () => ({ ok: true, json: async () => ({
      meta: { current_tick: 1, demo_queries: [] }, lines: [], pointers: {}, edges: [], nodes: [],
    }) }),
    cytoscape: () => ({ elements: () => ({ remove() {} }), add() {}, layout: () => ({ run() {} }) }),
    console, setTimeout, URL, Blob,
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "app.js"), "utf8"), context);
  await new Promise((resolve) => setImmediate(resolve));
  function begin(name) {
    const gate = deferred();
    pending.set(name, gate);
    element("file").files = [{ size: 1, text: async () => name }];
    const result = element("file").dispatch("change");
    return { gate, result };
  }
  return { element, begin };
}

function verified(query) {
  return { query, note: "", tick: 1, sources: [] };
}

test("a newly selected file hides the previous review while verifying", async () => {
  const app = await workspace();
  const first = app.begin("first");
  first.gate.resolve(verified("first investigation"));
  await first.result;
  assert.equal(app.element("incoming").hidden, false);
  assert.equal(app.element("incoming-query").textContent, "first investigation");

  const second = app.begin("second");
  assert.equal(app.element("incoming").hidden, true);
  app.element("adopt").dispatch("click");
  assert.equal(app.element("query").value, "initial");
  second.gate.resolve(verified("second investigation"));
  await second.result;
  assert.equal(app.element("incoming-query").textContent, "second investigation");
});

test("a slower previous validation cannot replace the latest review", async () => {
  const app = await workspace();
  const first = app.begin("first"), second = app.begin("second");
  second.gate.resolve(verified("second investigation"));
  await second.result;
  first.gate.resolve(verified("first investigation"));
  await first.result;
  assert.equal(app.element("incoming-query").textContent, "second investigation");
});
